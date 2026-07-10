/**
 * One-time migration: Fixes studentIdHash and studentIdImageHash indexes.
 * Drops old non-unique indexes, recreates as unique+sparse, resets duplicates.
 * Run: node scripts/fix-id-indexes.cjs
 */

const { MongoClient } = require("mongodb");
const path = require("path");

// Load .env.local
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB:", uri.replace(/:\/\/.*@/, "://***@"));

    const db = client.db();
    const col = db.collection("users");

    // ── Step 1: Drop old non-unique indexes ───────────────────────────────
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (["studentIdHash_1", "studentIdImageHash_1"].includes(idx.name)) {
        console.log(`Dropping old index: ${idx.name} (unique=${idx.unique})`);
        await col.dropIndex(idx.name);
      }
    }

    // ── Step 2: Recreate with unique: true, sparse: true ─────────────────
    await col.createIndex(
      { studentIdHash: 1 },
      { unique: true, sparse: true, name: "studentIdHash_1" }
    );
    console.log("✅ Created: studentIdHash_1 (unique, sparse)");

    await col.createIndex(
      { studentIdImageHash: 1 },
      { unique: true, sparse: true, name: "studentIdImageHash_1" }
    );
    console.log("✅ Created: studentIdImageHash_1 (unique, sparse)");

    // ── Step 3: Find and reset duplicate studentIdHash accounts ──────────
    const hashDups = await col.aggregate([
      { $match: { studentIdHash: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$studentIdHash", count: { $sum: 1 }, ids: { $push: "$_id" }, emails: { $push: "$email" } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (hashDups.length === 0) {
      console.log("✅ No duplicate studentIdHash found.");
    } else {
      console.warn(`⚠️  Found ${hashDups.length} duplicate identity hash group(s). Resetting duplicates...`);
      for (const g of hashDups) {
        const [keepId, ...resetIds] = g.ids;
        const [keepEmail, ...resetEmails] = g.emails;
        console.log(`   Keeping: ${keepEmail}`);
        console.log(`   Resetting: ${resetEmails.join(", ")}`);
        await col.updateMany(
          { _id: { $in: resetIds } },
          { $set: { verified: false }, $unset: { studentIdHash: "", studentIdImageHash: "" } }
        );
      }
    }

    // ── Step 4: Find and reset duplicate studentIdImageHash accounts ──────
    const imgDups = await col.aggregate([
      { $match: { studentIdImageHash: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$studentIdImageHash", count: { $sum: 1 }, ids: { $push: "$_id" }, emails: { $push: "$email" } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (imgDups.length === 0) {
      console.log("✅ No duplicate studentIdImageHash found.");
    } else {
      console.warn(`⚠️  Found ${imgDups.length} duplicate image hash group(s). Resetting duplicates...`);
      for (const g of imgDups) {
        const [keepId, ...resetIds] = g.ids;
        const [keepEmail, ...resetEmails] = g.emails;
        console.log(`   Keeping: ${keepEmail}`);
        console.log(`   Resetting: ${resetEmails.join(", ")}`);
        await col.updateMany(
          { _id: { $in: resetIds } },
          { $set: { verified: false }, $unset: { studentIdHash: "", studentIdImageHash: "" } }
        );
      }
    }

    console.log("\n🎉 Migration complete. All ID indexes are now unique and duplicates have been reset.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

run();
