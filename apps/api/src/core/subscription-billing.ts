import {
  Merchant,
  User,
  IMerchant,
  IUser,
  mongoose,
} from "@qodinger/knot-database";
import { NotificationService } from "../infra/notification-service.js";

/**
 * 🔄 Subscription Billing Engine
 *
 * Handles automated monthly subscription charging for merchants on paid plans.
 * Runs via cron job on the 1st of each month.
 */
export class SubscriptionBilling {
  private static instance: SubscriptionBilling;

  public static getInstance(): SubscriptionBilling {
    if (!SubscriptionBilling.instance) {
      SubscriptionBilling.instance = new SubscriptionBilling();
    }
    return SubscriptionBilling.instance;
  }

  /**
   * Process monthly subscription billing for all merchants
   */
  public async processMonthlyBilling(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    downgraded: number;
    revenue: number;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      downgraded: 0,
      revenue: 0,
    };

    console.log("🔄 Starting monthly subscription billing...");

    try {
      // Get all merchants on paid plans
      const paidMerchants = await Merchant.find({
        plan: { $in: ["professional", "enterprise"] },
        isActive: true,
      }).populate("userId");

      console.log(`📊 Found ${paidMerchants.length} merchants on paid plans`);

      for (const merchant of paidMerchants) {
        results.processed++;

        try {
          const billingResult = await this.processMerchantBilling(merchant);

          if (billingResult.success) {
            results.successful++;
            results.revenue += billingResult.charged;
          } else {
            if (billingResult.downgraded) {
              results.downgraded++;
            } else {
              results.failed++;
            }
          }

          // Add small delay to avoid overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            "❌ Billing failed for merchant ${merchant.merchantId}:",
            error,
          );
          results.failed++;
        }
      }

      console.log("✅ Monthly billing complete:", {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        downgraded: results.downgraded,
        revenue: `$${results.revenue.toFixed(2)}`,
      });

      return results;
    } catch (error) {
      console.error("❌ Monthly billing process failed:", error);
      throw error;
    }
  }

  /**
   * Process billing for a single merchant
   */
  private async processMerchantBilling(
    merchant: IMerchant & { userId?: IUser | mongoose.Types.ObjectId },
  ): Promise<{
    success: boolean;
    charged: number;
    downgraded: boolean;
    reason?: string;
  }> {
    const planCosts = {
      professional: 29,
      enterprise: 99,
    };

    const plan = merchant.plan as "professional" | "enterprise";
    const cost = planCosts[plan];
    const user = merchant.userId;

    // Helper function to check if userId is populated as IUser
    const isPopulatedUser = (
      userId: IUser | mongoose.Types.ObjectId | undefined,
    ): userId is IUser => {
      return (
        userId !== undefined && !(userId instanceof mongoose.Types.ObjectId)
      );
    };

    // Check if user exists and is populated
    if (!user || !isPopulatedUser(user) || user.creditBalance < cost) {
      console.log(
        "💸 Insufficient balance for ${merchant.merchantId} (${plan}) - downgrading to starter",
      );

      // Downgrade to starter plan
      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: {
          plan: "starter",
          spreadEnabled: true, // Enable spread for starter
          planStartedAt: new Date(),
        },
      });

      // Send notification
      await NotificationService.create({
        merchantId: merchant._id.toString(),
        title: "Plan Downgraded",
        description: `Insufficient balance for ${plan} plan. Downgraded to Starter. Top up to upgrade again.`,
        type: "warning",
        link: "/dashboard/billing",
      });

      return {
        success: false,
        charged: 0,
        downgraded: true,
        reason: "Insufficient balance",
      };
    }

    // Charge the subscription fee
    await User.findByIdAndUpdate(user._id, {
      $inc: { creditBalance: -cost },
    });

    // Update merchant's plan start date
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { planStartedAt: new Date() },
    });

    // Send success notification
    await NotificationService.create({
      merchantId: merchant._id.toString(),
      title: "Subscription Renewed",
      description: `Your ${plan} plan has been renewed for $${cost.toFixed(2)}.`,
      type: "success",
      link: "/dashboard/billing",
    });

    console.log(
      "💳 Charged ${merchant.merchantId} $${cost.toFixed(2)} for ${plan} plan",
    );

    return {
      success: true,
      charged: cost,
      downgraded: false,
    };
  }

  /**
   * Get billing status for a merchant
   */
  public async getMerchantBillingStatus(merchantId: string): Promise<{
    plan: string;
    planStartedAt: Date;
    nextBillingDate: Date;
    monthlyCost: number;
    daysUntilBilling: number;
  }> {
    const merchant = await Merchant.findOne({ merchantId });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const planCosts = {
      starter: 0,
      professional: 29,
      enterprise: 99,
    };

    const planStartedAt = merchant.planStartedAt || new Date();
    const nextBillingDate = new Date(planStartedAt);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    nextBillingDate.setDate(1); // Always bill on the 1st

    const daysUntilBilling = Math.ceil(
      (nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      plan: merchant.plan,
      planStartedAt,
      nextBillingDate,
      monthlyCost: planCosts[merchant.plan as keyof typeof planCosts],
      daysUntilBilling: Math.max(0, daysUntilBilling),
    };
  }

  /**
   * Check if billing is due (runs daily to trigger monthly billing on the 1st)
   */
  public async checkAndProcessBilling(): Promise<boolean> {
    const today = new Date();
    const isFirstOfMonth = today.getDate() === 1;

    if (isFirstOfMonth) {
      console.log("📅 Today is the 1st - processing monthly billing");
      await this.processMonthlyBilling();
      return true;
    }

    return false;
  }
}
