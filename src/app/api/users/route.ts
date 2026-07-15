import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// List / search users
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const year = searchParams.get("year");
    const skill = searchParams.get("skill");
    const cofounder = searchParams.get("cofounder");
    const college = searchParams.get("college");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );

    type UserQuery = {
      year?: number;
      college?: string;
      skills?: { $regex: string; $options: string };
      $or?: Array<Record<string, { $regex: string; $options: string }>>;
      "collaborationStatus.level"?: number;
    };
    const query: UserQuery = {};
    if (year) query.year = parseInt(year, 10);
    if (skill) query.skills = { $regex: skill, $options: "i" };
    if (college) query.college = college;
    if (cofounder === "true") query["collaborationStatus.level"] = 3;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { interests: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "publicId name email year college city verified skills interests bio role collaborationStatus verified"
        ),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Sync / create user (called after auth sign-in)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { firebaseUid, email, name } = body;

    if (!firebaseUid || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ firebaseUid });

    // Calculate year and role from Name (RegNo) or Email
    let yearOfStudy = 1;
    let calculatedRole = "student";

    // 1. Try to parse Registration Number from Name (e.g., "Tanush Bhootra 24BRS1282")
    // Pattern: 2 digits (Year), optional space, 3 letters (Branch), optional space, 4 digits (Serial)
    // Case insensitive for branch code
    const regNoMatch = name.match(/\b(\d{2})\s*([a-zA-Z]{3})\s*(\d{4})\b/);

    if (regNoMatch) {
      const shortYear = parseInt(regNoMatch[1], 10); // e.g., 24
      const joiningYear = 2000 + shortYear; // 2024

      const now = new Date();
      const currentCalendarYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11. July is 6.

      yearOfStudy = currentCalendarYear - joiningYear;
      if (currentMonth >= 6) {
        // July or later
        yearOfStudy += 1;
      }
    } else {
      // 2. Fallback: Extract from Email (some colleges use 2021@college.edu or 21@college.edu format)
      const match = email.match(/(\d{2,4})@.*$/);
      if (match) {
        let joiningYear = parseInt(match[1], 10);
        if (joiningYear < 100) joiningYear += 2000; // handle '21' as 2021
        const now = new Date();
        const currentCalendarYear = now.getFullYear();
        const currentMonth = now.getMonth();

        yearOfStudy = currentCalendarYear - joiningYear;
        if (currentMonth >= 6) {
          yearOfStudy += 1;
        }
      }
    }

    if (yearOfStudy < 1) yearOfStudy = 1;
    if (yearOfStudy > 4) calculatedRole = "alumni";

    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        name,
        role: calculatedRole,
        year: yearOfStudy,
        profileLocked: false,
        skills: [],
        interests: [],
      });
    } else {
      // Update existing user
      const updates: any = {};

      // Update Year if changed
      if (!user.year || user.year !== yearOfStudy) {
        updates.year = yearOfStudy;
      }

      // Update Role if changed (and not admin)
      if (user.role !== "admin" && user.role !== calculatedRole) {
        updates.role = calculatedRole;
      }



      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
      }

      // Backfill publicId for legacy users (findByIdAndUpdate would skip pre-save)
      if (!user.publicId) {
        // @ts-ignore
        user.publicId = undefined;
      }

      if (Object.keys(updates).length > 0 || !user.publicId) {
        await user.save();
      }
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
