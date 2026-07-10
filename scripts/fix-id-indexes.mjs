/**
 * One-time migration script: Drop and recreate studentIdHash and studentIdImageHash
 * indexes with unique: true, sparse: true so MongoDB enforces uniqueness.
 *
 * Also clears the 'verified' flag from any account whose studentIdHash is a
 * duplicate of another account (i.e., an account that slipped through before
 * the fix).
 *
 * Run with: node scripts/fix-id-indexes.mjs
 */

import { MongoClient } from "mongodb";
import crypto from "crypto";
import "dotenv/config";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in environment.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db(); // uses the DB from the URI
    const col = db.collection("users");

    // ── Step 1: Drop old non-unique indexes if they exist ──────────────────
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (["studentIdHash_1", "studentIdImageHash_1"].includes(idx.name)) {
        console.log(`Dropping old index: ${idx.name}`);
        await col.dropIndex(idx.name);
      }
    }

    // ── Step 2: Recreate with unique: true, sparse: true ──────────────────
    await col.createIndex(
      { studentIdHash: 1 },
      { unique: true, sparse: true, name: "studentIdHash_1" }
    );
    console.log("Created unique sparse index: studentIdHash_1");

    await col.createIndex(
      { studentIdImageHash: 1 },
      { unique: true, sparse: true, name: "studentIdImageHash_1" }
    );
    console.log("Created unique sparse index: studentIdImageHash_1");

    // ── Step 3: Find any duplicate studentIdHash values ───────────────────
    // Group by hash, find any group with more than one document.
    const duplicates = await col
      .aggregate([
        { $match: { studentIdHash: { $ne: null } } },
        { $group: { _id: "$studentIdHash", count: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length === 0) {
      console.log("No duplicate studentIdHash values found.");
    } else {
      console.warn(`Found ${duplicates.length} duplicate hash group(s). Resetting duplicate accounts...`);
      for (const group of duplicates) {
        // Keep the first document (earliest created), reset all others
        const [keep, ...resetIds] = group.ids;
        console.log(`  Hash: ${group._id} — keeping ${keep}, resetting: ${resetIds.join(", ")}`);
        await col.updateMany(
          { _id: { $in: resetIds } },
          {
            $set: { verified: false },
            $unset: { studentIdHash: "", studentIdImageHash: "" },
          }
        );
      }
    }

    // ── Step 4: Find any duplicate studentIdImageHash values ─────────────
    const imageDuplicates = await col
      .aggregate([
        { $match: { studentIdImageHash: { $ne: null } } },
        { $group: { _id: "$studentIdImageHash", count: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (imageDuplicates.length === 0) {
      console.log("No duplicate studentIdImageHash values found.");
    } else {
      console.warn(`Found ${imageDuplicates.length} duplicate image hash group(s). Resetting duplicate accounts...`);
      for (const group of imageDuplicates) {
        const [keep, ...resetIds] = group.ids;
        console.log(`  Image hash group: keeping ${keep}, resetting: ${resetIds.join(", ")}`);
        await col.updateMany(
          { _id: { $in: resetIds } },
          {
            $set: { verified: false },
            $unset: { studentIdHash: "", studentIdImageHash: "" },
          }
        );
      }
    }

    console.log("\n✅ Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
