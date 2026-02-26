import { connectToDatabase } from "@qodinger/knot-database";
import {
  Invoice,
  WebhookEvent,
  Notification,
  Merchant,
  User,
} from "@qodinger/knot-database";

/**
 * 📇 Database Index Migration Script
 *
 * Creates compound indexes for common query patterns to improve performance.
 * Run this script once during deployment to optimize database queries.
 *
 * Usage:
 *   pnpm tsx src/scripts/create-indexes.ts
 */

export async function createDatabaseIndexes() {
  console.log("📇 Creating database indexes...");

  try {
    // Connect to database
    const mongoUri =
      process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/knotengine";
    await connectToDatabase(mongoUri);
    console.log("✅ Connected to MongoDB");

    // ============================================
    // Invoice Indexes
    // ============================================
    console.log("\n📋 Creating Invoice indexes...");

    // Compound index for invoice lookup by ID and status
    await Invoice.collection.createIndex({ invoiceId: 1, status: 1 });
    console.log("  ✅ { invoiceId: 1, status: 1 }");

    // Compound index for merchant invoice listing with testnet filtering
    await Invoice.collection.createIndex({
      merchantId: 1,
      "metadata.isTestnet": 1,
      createdAt: -1,
    });
    console.log("  ✅ { merchantId: 1, metadata.isTestnet: 1, createdAt: -1 }");

    // Index for payAddress lookup during webhook processing
    await Invoice.collection.createIndex({
      payAddress: 1,
      status: 1,
    });
    console.log("  ✅ { payAddress: 1, status: 1 }");

    // Compound index for expiration job
    await Invoice.collection.createIndex({
      expiresAt: 1,
      status: 1,
    });
    console.log("  ✅ { expiresAt: 1, status: 1 }");

    // Compound index for webhook retry job
    await Invoice.collection.createIndex({
      webhookDelivered: 1,
      webhookAttempts: 1,
      status: 1,
    });
    console.log("  ✅ { webhookDelivered: 1, webhookAttempts: 1, status: 1 }");

    // Index for invoice status lookup (common in dashboard)
    await Invoice.collection.createIndex({
      merchantId: 1,
      status: 1,
      createdAt: -1,
    });
    console.log("  ✅ { merchantId: 1, status: 1, createdAt: -1 }");

    // ============================================
    // WebhookEvent Indexes
    // ============================================
    console.log("\n📡 Creating WebhookEvent indexes...");

    // Compound index for idempotency check
    await WebhookEvent.collection.createIndex({
      txHash: 1,
      invoiceId: 1,
    });
    console.log("  ✅ { txHash: 1, invoiceId: 1 }");

    // Compound index for cumulative amount calculation (if needed)
    await WebhookEvent.collection.createIndex({
      invoiceId: 1,
      processed: 1,
    });
    console.log("  ✅ { invoiceId: 1, processed: 1 }");

    // Index for address-based lookup
    await WebhookEvent.collection.createIndex({
      toAddress: 1,
      processed: 1,
    });
    console.log("  ✅ { toAddress: 1, processed: 1 }");

    // ============================================
    // Notification Indexes
    // ============================================
    console.log("\n🔔 Creating Notification indexes...");

    // Compound index for deduplication check
    await Notification.collection.createIndex({
      merchantId: 1,
      "meta.invoiceId": 1,
      isRead: 1,
    });
    console.log("  ✅ { merchantId: 1, meta.invoiceId: 1, isRead: 1 }");

    // Compound index for notification listing
    await Notification.collection.createIndex({
      merchantId: 1,
      isRead: 1,
      createdAt: -1,
    });
    console.log("  ✅ { merchantId: 1, isRead: 1, createdAt: -1 }");

    // ============================================
    // Merchant Indexes
    // ============================================
    console.log("\n🏪 Creating Merchant indexes...");

    // Compound index for API key authentication
    await Merchant.collection.createIndex({
      apiKeyHash: 1,
      isActive: 1,
    });
    console.log("  ✅ { apiKeyHash: 1, isActive: 1 }");

    // Compound index for OAuth authentication
    await Merchant.collection.createIndex({
      oauthId: 1,
      isActive: 1,
    });
    console.log("  ✅ { oauthId: 1, isActive: 1 }");

    // Compound index for user lookup
    await Merchant.collection.createIndex({
      userId: 1,
      isActive: 1,
    });
    console.log("  ✅ { userId: 1, isActive: 1 }");

    // ============================================
    // User Indexes
    // ============================================
    console.log("\n👤 Creating User indexes...");

    // Index for email lookup
    await User.collection.createIndex({ email: 1 });
    console.log("  ✅ { email: 1 }");

    // Index for OAuth lookup
    await User.collection.createIndex({ oauthId: 1 });
    console.log("  ✅ { oauthId: 1 }");

    // ============================================
    // Summary
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ All database indexes created successfully!");
    console.log("=".repeat(50));

    // List all indexes for verification
    console.log("\n📊 Index Summary:");

    const collections = [
      { name: "invoices", model: Invoice },
      { name: "webhookevents", model: WebhookEvent },
      { name: "notifications", model: Notification },
      { name: "merchants", model: Merchant },
      { name: "users", model: User },
    ];

    for (const collection of collections) {
      const indexes = await collection.model.collection.indexes();
      console.log(`\n${collection.name}: ${indexes.length} indexes`);
    }
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDatabaseIndexes();
}
