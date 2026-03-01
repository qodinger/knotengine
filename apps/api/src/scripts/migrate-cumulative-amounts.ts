import { connectToDatabase } from "@qodinger/knot-database";
import { Invoice, WebhookEvent } from "@qodinger/knot-database";
import { config } from "dotenv";

/**
 * 🔄 Cumulative Amount Migration Script
 *
 * Migrates existing invoices to use incremental amount tracking.
 * Calculates the cumulative cryptoAmountReceived from all webhook events
 * and updates each invoice accordingly.
 *
 * Prerequisites:
 *   - MongoDB must be running
 *   - DATABASE_URL environment variable should be set
 *
 * Usage:
 *   pnpm tsx src/scripts/migrate-cumulative-amounts.ts
 *
 * Docker Setup:
 *   docker-compose up -d  # Starts MongoDB and Redis
 *
 * ⚠️ IMPORTANT: Run this script during a maintenance window for production
 */

export async function migrateCumulativeAmounts() {
  console.log("🔄 Starting cumulative amount migration...\n");

  // Load environment variables from .env.development
  config({ path: ".env.development" });

  // Validate environment
  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error(
      "   Please set DATABASE_URL in your .env file or environment",
    );
    console.error("   Example: mongodb://127.0.0.1:27017/knotengine");
    process.exit(1);
  }

  try {
    // Connect to database
    await connectToDatabase(mongoUri);

    // Find all invoices that might have received payments
    const invoices = await Invoice.find({
      status: {
        $in: [
          "pending",
          "mempool_detected",
          "confirming",
          "partially_paid",
          "confirmed",
          "overpaid",
        ],
      },
    }).sort({ createdAt: 1 });

    console.log(`📊 Found ${invoices.length} invoices to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize);
      const batchPromises = batch.map(async (invoice) => {
        try {
          // Get all processed webhook events for this invoice
          const events = await WebhookEvent.find({
            invoiceId: invoice._id,
            processed: true,
          }).select("amount");

          // Calculate cumulative amount
          const total = events.reduce((sum, e) => {
            const amount = parseFloat(e.amount);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          // Only update if there's a difference or if we have events
          if (events.length > 0 || total > 0) {
            const currentAmount = invoice.cryptoAmountReceived || 0;

            // Skip if already correct
            if (Math.abs(currentAmount - total) < 0.00000001) {
              skipped++;
              return;
            }

            // Update invoice with calculated amount
            await Invoice.findByIdAndUpdate(invoice._id, {
              $set: {
                cryptoAmountReceived: parseFloat(total.toFixed(8)),
              },
            });

            migrated++;

            if (migrated % 10 === 0) {
              console.log(`  ⏳ Migrated ${migrated} invoices...`);
            }
          } else {
            skipped++;
          }
        } catch (err) {
          errors++;
          console.error(
            `  ❌ Error migrating invoice ${invoice.invoiceId}:`,
            err,
          );
        }
      });

      await Promise.all(batchPromises);

      console.log(
        `📈 Progress: ${Math.min(i + batchSize, invoices.length)}/${invoices.length}`,
      );
    }

    // ============================================
    // Summary
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ Migration completed successfully!");
    console.log("=".repeat(50));
    console.log(`📊 Total invoices processed: ${invoices.length}`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped (no changes needed): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Error during migration:", error);
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Ensure MongoDB is running: docker-compose up -d");
    console.error("   2. Check DATABASE_URL is set correctly");
    console.error(
      "   3. Verify MongoDB connection: mongosh --eval 'db.adminCommand(\"ping\")'",
    );
    throw error;
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCumulativeAmounts();
}
