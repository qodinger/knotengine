import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

// Load development env
dotenv.config({ path: path.join(__dirname, "../../../../.env.development") });

async function resetDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
  }

  console.log(`🔌 Connecting to: ${url.replace(/:[^:]+@/, ":****@")}`); // Hide password in logs

  try {
    await mongoose.connect(url);
    console.log("✅ Connected to MongoDB");

    const dbName = mongoose.connection.name;

    // Safety check: Only allow dropping databases with "-dev" in the name
    if (!dbName.endsWith("-dev") || process.env.NODE_ENV === "production") {
      console.error(
        `❌ ABORTED: Disallowed to drop database "${dbName}". Safety guards active.`,
      );
      return;
    }

    console.log(`⚠️  DANGER: About to drop database: "${dbName}"`);

    // We drop the database to clear all collections, indexes, and data
    await mongoose.connection.db?.dropDatabase();

    console.log(`✨ Database "${dbName}" has been successfully nuked.`);
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetDatabase();
