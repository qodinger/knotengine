import { Queue, Worker, Job } from "bullmq";
import { RedisClient } from "./redis-client.js";
import { WebhookDispatcher } from "./webhook-dispatcher.js";

/**
 * 📬 Webhook Job Queue
 *
 * Manages asynchronous webhook delivery using BullMQ.
 * Provides:
 * - Parallel processing (10 concurrent jobs)
 * - Priority queue (confirmed > expired)
 * - Automatic retries with exponential backoff
 * - Job observability (metrics, logs)
 */
export class WebhookQueue {
  private static queue: Queue | null = null;
  private static worker: Worker | null = null;
  private static isInitialized = false;

  /**
   * Priority levels for webhook jobs
   */
  public static readonly Priority = {
    HIGH: 1, // invoice.confirmed (time-sensitive)
    NORMAL: 5, // invoice.expired, invoice.failed
    LOW: 10, // Other events
  };

  /**
   * Initializes the webhook queue and worker.
   * Should be called once during application startup.
   */
  public static init(): void {
    if (this.isInitialized) {
      console.log("📬 WebhookQueue already initialized");
      return;
    }

    const connection = RedisClient.getInstance();
    if (!connection) {
      console.warn(
        "⚠️ Redis not available, webhooks will use synchronous delivery",
      );
      return;
    }

    // Create the queue
    this.queue = new Queue("webhooks", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000, // 2s, 4s, 8s...
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
        },
      },
    });

    // Create the worker with concurrency
    this.worker = new Worker(
      "webhooks",
      async (job: Job) => {
        const { invoiceId, event, priority } = job.data;
        console.log(
          `📬 Processing webhook job ${job.id}: ${event} for ${invoiceId} (priority: ${priority})`,
        );

        const success = await WebhookDispatcher.dispatch(invoiceId, event);

        if (!success) {
          throw new Error(`Webhook delivery failed for ${invoiceId}`);
        }

        return { success, invoiceId, event };
      },
      {
        connection,
        concurrency: 10, // Process 10 webhooks in parallel
        limiter: {
          max: 50, // Max 50 jobs
          duration: 1000, // per second
        },
      },
    );

    // Event handlers
    this.worker.on("completed", (job) => {
      console.log(
        `✅ Webhook job ${job?.id} completed: ${job?.returnvalue?.event} for ${job?.returnvalue?.invoiceId}`,
      );
    });

    this.worker.on("failed", (job, err) => {
      console.error(
        `❌ Webhook job ${job?.id} failed: ${err.message}`,
        `Attempts: ${job?.attemptsMade}`,
      );
    });

    this.worker.on("error", (err) => {
      console.error("🔥 WebhookQueue worker error:", err);
    });

    this.worker.on("closing", () => {
      console.log("🔒 WebhookQueue worker closing...");
    });

    this.isInitialized = true;
    console.log("✅ WebhookQueue initialized (concurrency: 10)");
  }

  /**
   * Adds a webhook job to the queue.
   *
   * @param invoiceId - The invoice ID
   * @param event - The webhook event type
   * @param priority - Priority level (default: NORMAL)
   */
  public static async dispatch(
    invoiceId: string,
    event: string,
    priority: number = this.Priority.NORMAL,
  ): Promise<Job | null> {
    // If queue not initialized, fall back to synchronous delivery
    if (!this.queue || !this.isInitialized) {
      console.log("📬 WebhookQueue not ready, using synchronous delivery");
      await WebhookDispatcher.dispatch(invoiceId, event);
      return null;
    }

    const job = await this.queue.add(
      "webhook",
      { invoiceId, event, priority },
      {
        priority,
        jobId: `${invoiceId}:${event}:${Date.now()}`, // Unique job ID
      },
    );

    console.log(`📬 Webhook job ${job.id} queued: ${event} for ${invoiceId}`);

    return job;
  }

  /**
   * Dispatches a confirmed event with HIGH priority.
   */
  public static async dispatchConfirmed(
    invoiceId: string,
  ): Promise<Job | null> {
    return this.dispatch(invoiceId, "invoice.confirmed", this.Priority.HIGH);
  }

  /**
   * Dispatches an expired event with NORMAL priority.
   */
  public static async dispatchExpired(invoiceId: string): Promise<Job | null> {
    return this.dispatch(invoiceId, "invoice.expired", this.Priority.NORMAL);
  }

  /**
   * Dispatches a failed event with NORMAL priority.
   */
  public static async dispatchFailed(invoiceId: string): Promise<Job | null> {
    return this.dispatch(invoiceId, "invoice.failed", this.Priority.NORMAL);
  }

  /**
   * Gets queue statistics.
   */
  public static async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    if (!this.queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Gets all jobs in the queue (for debugging).
   */
  public static async getJobs(
    start: number = 0,
    end: number = 100,
  ): Promise<Job[]> {
    if (!this.queue) return [];
    return this.queue.getJobs(["waiting", "active", "delayed"], start, end);
  }

  /**
   * Removes a specific job from the queue.
   */
  public static async removeJob(jobId: string): Promise<boolean> {
    if (!this.queue) return false;
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  /**
   * Drains the queue (useful for testing or maintenance).
   */
  public static async drain(): Promise<void> {
    if (!this.queue) return;
    await this.queue.drain();
    console.log("🧹 WebhookQueue drained");
  }

  /**
   * Gracefully shuts down the queue and worker.
   */
  public static async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log("🔒 WebhookQueue worker closed");
    }

    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      console.log("🔒 WebhookQueue closed");
    }

    this.isInitialized = false;
  }

  /**
   * Checks if the queue is initialized and ready.
   */
  public static isReady(): boolean {
    return this.isInitialized && this.queue !== null && this.worker !== null;
  }
}
