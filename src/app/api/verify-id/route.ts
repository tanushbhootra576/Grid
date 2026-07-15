import { NextRequest, NextResponse } from "next/server";
import { createWorker, Worker } from "tesseract.js";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import path from "path";
import os from "os";

// 🔥 VERCEL FIX: Force Vercel's node-file-trace (NFT) to include these files in the serverless bundle!
// Tesseract dynamically forks a child process which calls `require('..')`. 
// NFT misses this dynamic require, causing the "Cannot find module '..'" error.
try {
  require.resolve("tesseract.js/src/worker-script/node/index.js");
  require.resolve("tesseract.js/src/worker-script/index.js");
  require.resolve("tesseract.js-core/tesseract-core.wasm.js");
} catch (e) {
  // Ignore at runtime, this is strictly for the Vercel static bundler
}

const globalForTesseract = globalThis as unknown as {
  tesseractWorker: Worker | null;
};

async function getWorker() {
  if (!globalForTesseract.tesseractWorker) {
    // Bundle the language data locally to avoid Vercel network timeout errors
    const langPath = path.join(process.cwd(), "public", "tessdata");
    
    globalForTesseract.tesseractWorker = await createWorker("eng", 1, {
      langPath,
      cachePath: os.tmpdir(), // Fixes read-only filesystem errors on Vercel deployments
    });
  }
  return globalForTesseract.tesseractWorker;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hash the raw base64 image bytes — catches ANY re-upload of the same file */
function hashImage(base64: string): string {
  return crypto.createHash("sha256").update(base64).digest("hex");
}

/**
 * Deterministic salted hash of the student's identity extracted from the card.
 * Uses Roll/Enrollment Number if found (strongest), otherwise Name.
 * Both are combined with the College name.
 */
function hashIdentity(
  extractedName: string,
  extractedCollege: string,
  extractedIdNumber: string
): string {
  const salt =
    process.env.STUDENT_ID_HASH_SALT ||
    process.env.NEXTAUTH_SECRET ||
    "grid-salt-fallback";

  const identifier = extractedIdNumber
    ? extractedIdNumber.toLowerCase().trim()
    : extractedName.toLowerCase().trim();

  const input = `${identifier}|${extractedCollege.toLowerCase().trim()}`;
  return crypto.createHmac("sha256", salt).update(input).digest("hex");
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // ── Auth: get session email ───────────────────────────────────────────────
    const session = await getServerSession();
    const sessionEmail = session?.user?.email;

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized – please sign in." }, { status: 401 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let idImageBase64: string;
    try {
      const body = await req.json();
      idImageBase64 = body?.idImageBase64 ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!idImageBase64 || idImageBase64.length < 100) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

    // ── Lookup current user ───────────────────────────────────────────────────
    const user = await User.findOne({ email: sessionEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // ── Already verified? ─────────────────────────────────────────────────────
    if (user.verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        data: { reason: "Your account is already verified." },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 1: Image fingerprint check (fastest – no AI needed)
    // ─────────────────────────────────────────────────────────────────────────
    const imageHash = hashImage(idImageBase64);

    const imageDuplicate = await User.findOne({
      studentIdImageHash: imageHash,
      _id: { $ne: user._id },
    }).lean();

    if (imageDuplicate) {
      console.warn(
        `[verify-id] Image duplicate: ${sessionEmail} tried to reuse image already used by ${(imageDuplicate as any).email}`
      );
      return NextResponse.json({
        success: false,
        verified: false,
        duplicateAccount: true,
        data: {
          reason:
            "This exact ID card photo is already linked to another account on Grid. " +
            "Each student must use their own original ID card photo. " +
            "Multiple accounts are not permitted.",
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 2: OCR Extraction (Lightweight, No API Keys)
    // ─────────────────────────────────────────────────────────────────────────
    let extractedText = "";
    try {
      // Ensure the image string is a proper data URI for Tesseract
      let tesseractInput = idImageBase64;
      if (!idImageBase64.startsWith("data:image")) {
        // Defaulting to jpeg if mime type isn't provided in the base64 string
        tesseractInput = `data:image/jpeg;base64,${idImageBase64}`;
      }
      
      const worker = await getWorker();
      const { data: { text } } = await worker.recognize(tesseractInput);
      extractedText = text;
    } catch (e) {
      console.error("[verify-id] OCR Error:", e);
      return NextResponse.json(
        { error: "Failed to read text from the image. Please try again with a clearer photo." },
        { status: 500 }
      );
    }

    // Basic logic to check if name is in the card
    const textLower = extractedText.toLowerCase();
    
    // We split the user's name and check if at least their first and last name appear
    const nameParts = user.name.toLowerCase().split(" ").filter((p: string) => p.length > 2);
    let matchedParts = 0;
    for (const part of nameParts) {
        if (textLower.includes(part)) {
            matchedParts++;
        }
    }
    
    // 🔥 SECURITY FIX: Require 100% match for names with 1 or 2 parts. 
    // Prevents friends from hiding half the name to reuse the same ID.
    const requiredMatches = nameParts.length <= 2 ? nameParts.length : Math.ceil(nameParts.length * 0.75);
    const nameMatches = nameParts.length > 0 ? (matchedParts >= requiredMatches) : textLower.includes(user.name.toLowerCase());

    // 🔥 SECURITY FIX: Verify the college on the ID matches the selected college in the profile.
    const userCollege = user.college || "";
    const userCollegeLower = userCollege.toLowerCase();
    const INDIAN_COLLEGES = require("@/data/colleges").INDIAN_COLLEGES;
    const collegeObj = INDIAN_COLLEGES.find((c: any) => c.name === userCollege);
    
    let collegeMatches = false;
    let antiSpoofingFailed = false;

    if (userCollege) {
      const words = userCollegeLower.split(/[\s,.-]+/).filter((w: string) => w.length > 3 && !['institute', 'technology', 'engineering', 'college', 'university', 'national', 'indian', 'deemed', 'science'].includes(w));
      
      if (textLower.includes(userCollegeLower)) {
        collegeMatches = true;
      } else {
        const shortName = (collegeObj?.short || "").toLowerCase();
        if (shortName && textLower.includes(shortName)) {
           collegeMatches = true;
        } else if (words.length > 0) {
           collegeMatches = words.some((word: string) => textLower.includes(word));
        } else {
           collegeMatches = textLower.includes(userCollegeLower.split(' ')[0]);
        }
      }

      // --- Campus Anti-Spoofing Check ---
      // Prevents using an ID from a different campus (e.g. VIT Chennai ID for VIT Vellore)
      if (collegeMatches && collegeObj) {
         const siblingColleges = INDIAN_COLLEGES.filter((c: any) => 
            c.name !== collegeObj.name && 
            ((c.short && c.short === collegeObj.short) || (words.length > 0 && c.name.toLowerCase().includes(words[0])))
         );
         
         for (const sibling of siblingColleges) {
            const siblingCity = (sibling.city || "").toLowerCase();
            const ourCity = (collegeObj.city || "").toLowerCase();
            
            // If the ID card explicitly names a different campus city, and NOT our city, it's a mismatch.
            if (siblingCity && siblingCity !== ourCity && siblingCity.length > 3 && textLower.includes(siblingCity)) {
               if (!ourCity || !textLower.includes(ourCity)) {
                  antiSpoofingFailed = true;
                  break;
               }
            }
         }
      }
    }

    if (antiSpoofingFailed) {
      collegeMatches = false;
    }

    // Basic regex to find an ID number (e.g. 6+ alphanumeric characters)
    const possibleIds = extractedText.match(/\b[A-Z0-9]{6,15}\b/g) || [];
    const extractedIdNumber = possibleIds[0] || "";
    const extractedCollege = collegeMatches ? userCollege : "Verified College (OCR fallback)";

    const aiResult = {
      isValidId: nameMatches && collegeMatches,
      nameMatches: nameMatches,
      collegeMatches: collegeMatches,
      extractedName: nameMatches ? user.name : "",
      extractedCollege: extractedCollege,
      extractedIdNumber: extractedIdNumber,
      confidenceScore: (nameMatches && collegeMatches) ? 0.9 : 0.3,
      reason: (nameMatches && collegeMatches)
        ? "Name and College matched successfully via OCR." 
        : (!nameMatches ? "Could not find matching name on the ID card." : "ID card does not appear to belong to your selected college.")
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 3: Validate AI result
    // ─────────────────────────────────────────────────────────────────────────
    if (!aiResult.isValidId || !aiResult.nameMatches || !aiResult.collegeMatches) {
      return NextResponse.json({ success: false, verified: false, data: aiResult });
    }

    const extractedName = (aiResult.extractedName || "").trim();

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 4: Identity hash check
    // ─────────────────────────────────────────────────────────────────────────
    const identityHash = hashIdentity(extractedName, extractedCollege, extractedIdNumber);

    const identityDuplicate = await User.findOne({
      studentIdHash: identityHash,
      _id: { $ne: user._id },
    }).lean();

    if (identityDuplicate) {
      console.warn(
        `[verify-id] Identity duplicate: ${sessionEmail} matches existing verified account ${(identityDuplicate as any).email}`
      );
      return NextResponse.json({
        success: false,
        verified: false,
        duplicateAccount: true,
        data: {
          reason:
            "This student identity is already linked to another account on Grid. " +
            "Only one account per student is allowed. " +
            "Contact support if you believe this is an error.",
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 5: Save
    // ─────────────────────────────────────────────────────────────────────────
    try {
      await User.findOneAndUpdate(
        {
          _id: user._id,
          verified: false,
        },
        {
          $set: {
            verified: true,
            studentIdHash: identityHash,
            studentIdImageHash: imageHash,
          },
        },
        { new: true }
      );
    } catch (saveErr: any) {
      if (saveErr.code === 11000) {
        return NextResponse.json({
          success: false,
          verified: false,
          duplicateAccount: true,
          data: {
            reason:
              "This student ID is already linked to another account on Grid. " +
              "Multiple accounts with the same student identity are not permitted.",
          },
        });
      }
      throw saveErr;
    }

    return NextResponse.json({
      success: true,
      verified: true,
      data: {
        ...aiResult,
        reason: `Verified: ${extractedName} via localized OCR.`,
      },
    });
  } catch (error: any) {
    console.error("[verify-id] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again." },
      { status: 500 }
    );
  }
}
