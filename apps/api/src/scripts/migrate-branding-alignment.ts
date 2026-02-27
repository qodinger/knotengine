/**
 * 🔄 Migration: Add brandingAlignment to all existing merchants
 *
 * Usage: pnpm tsx src/scripts/migrate-branding-alignment.ts
 */

import { Merchant, mongoose } from "@qodinger/knot-database";

async function migrateBrandingAlignment() {
  try {
    // Connect to MongoDB
    const mongoUrl =
      process.env.DATABASE_URL || "mongodb://localhost:27017/knotengine";
    await mongoose.connect(mongoUrl);

    console.log("📊 Starting brandingAlignment migration...");

    // Find all merchants without brandingAlignment
    const merchantsWithoutAlignment = await Merchant.countDocuments({
      brandingAlignment: { $exists: false },
    });

    console.log(
      `📋 Found ${merchantsWithoutAlignment} merchants without brandingAlignment`,
    );

    if (merchantsWithoutAlignment === 0) {
      console.log("✅ All merchants already have brandingAlignment field");
      process.exit(0);
    }

    // Update all merchants to have default "left" alignment
    const result = await Merchant.updateMany(
      { brandingAlignment: { $exists: false } },
      { $set: { brandingAlignment: "left" } },
    );

    console.log(
      `✅ Updated ${result.modifiedCount} merchants with brandingAlignment: "left"`,
    );
    console.log("🎉 Migration complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateBrandingAlignment();
