# 🔧 KnotEngine Performance Implementation Plan

**Version:** 1.0  
**Date:** February 26, 2026  
**Status:** Ready for Implementation

---

## 📋 Executive Summary

This document outlines a phased implementation plan to address performance bottlenecks identified in the KnotEngine API review. The plan prioritizes **high-impact, low-risk** optimizations first, followed by architectural improvements for scale.

**Current Performance Score:** 7/10  
**Target Performance Score:** 9/10  
**Estimated Implementation Time:** 2-3 weeks

---

## 🎯 Performance Goals

| Metric                            | Current    | Target     | Improvement         |
| --------------------------------- | ---------- | ---------- | ------------------- |
| Invoice Creation Latency (p95)    | ~800ms     | <200ms     | 4x faster           |
| Webhook Processing Throughput     | ~100 req/s | ~500 req/s | 5x faster           |
| Database Query Time (p95)         | ~50ms      | <10ms      | 5x faster           |
| Price Oracle Cache Hit Rate       | ~90%       | >99%       | 10x fewer API calls |
| Max Concurrent Socket Connections | ~10,000    | ~50,000    | 5x scale            |

---

## 📊 Phase 1: Critical Fixes (Week 1)

**Goal:** Address immediate bottlenecks that worsen with scale  
**Risk Level:** Low  
**Estimated Time:** 3-5 days

### 1.1 Incremental Amount Tracking ⚠️ HIGH PRIORITY

**Problem:** Cumulative amount calculation fetches ALL webhook events per update (O(n) complexity)

**Current Code:**

```typescript
// apps/api/src/core/confirmation-engine.ts (line ~140)
const allEvents = await WebhookEvent.find({
  invoiceId: invoice._id,
  processed: true,
});
const totalCryptoReceived = parseFloat(
  allEvents.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(8),
);
```

**Solution:** Store cumulative amount on invoice, increment on each event

**Implementation Steps:**

1. **Update Invoice Model** (`packages/database/src/models.ts`)

```typescript
export interface IInvoice {
  // ... existing fields ...
  cryptoAmountReceived: number; // ✅ Already exists
  // Add for tracking (optional):
  lastReceivedAmount?: number;
  lastReceivedAt?: Date;
}
```

2. **Update Confirmation Engine** (`apps/api/src/core/confirmation-engine.ts`)

```typescript
// Replace the O(n) calculation with incremental update
const receivedAmount = parseFloat(event.amount);

// ✅ Incremental update (constant time)
await Invoice.findByIdAndUpdate(invoice._id, {
  $set: {
    txHash: event.txHash,
    confirmations: event.confirmations,
    status: newStatus,
  },
  $inc: {
    cryptoAmountReceived: receivedAmount,
  },
  $setOnInsert: {
    lastReceivedAt: new Date(),
  },
  ...(event.blockNumber > 0
    ? { $set: { blockNumber: event.blockNumber } }
    : {}),
});

// Fetch fresh invoice for subsequent logic
const updatedInvoice = await Invoice.findById(invoice._id);
const totalCryptoReceived = updatedInvoice.cryptoAmountReceived;
```

3. **Migration Script** (`apps/api/src/scripts/migrate-cumulative-amounts.ts`)

```typescript
import { Invoice, WebhookEvent } from "@qodinger/knot-database";

export async function migrateCumulativeAmounts() {
  const invoices = await Invoice.find({
    status: {
      $in: ["pending", "mempool_detected", "confirming", "partially_paid"],
    },
  });

  for (const invoice of invoices) {
    const events = await WebhookEvent.find({
      invoiceId: invoice._id,
      processed: true,
    });

    const total = events.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    await Invoice.findByIdAndUpdate(invoice._id, {
      $set: { cryptoAmountReceived: total },
    });
  }

  console.log(`✅ Migrated ${invoices.length} invoices`);
}
```

**Acceptance Criteria:**

- [ ] Webhook processing time reduced from O(n) to O(1)
- [ ] Migration script tested on staging database
- [ ] No regression in amount calculation accuracy

---

### 1.2 Database Index Optimization ⚠️ HIGH PRIORITY

**Problem:** Common queries lack compound indexes, causing full collection scans

**Implementation Steps:**

1. **Create Index Migration Script** (`apps/api/src/scripts/create-indexes.ts`)

```typescript
import {
  Invoice,
  WebhookEvent,
  Notification,
  Merchant,
} from "@qodinger/knot-database";

export async function createDatabaseIndexes() {
  console.log("📇 Creating database indexes...");

  // Invoice indexes
  await Invoice.collection.createIndex({ invoiceId: 1, status: 1 });
  await Invoice.collection.createIndex({
    merchantId: 1,
    "metadata.isTestnet": 1,
    createdAt: -1,
  });
  await Invoice.collection.createIndex({
    payAddress: 1,
    status: 1,
  });
  await Invoice.collection.createIndex({ expiresAt: 1, status: 1 });
  await Invoice.collection.createIndex({
    webhookDelivered: 1,
    webhookAttempts: 1,
    status: 1,
  });

  // WebhookEvent indexes
  await WebhookEvent.collection.createIndex({
    txHash: 1,
    invoiceId: 1,
  });
  await WebhookEvent.collection.createIndex({
    invoiceId: 1,
    processed: 1,
  });
  await WebhookEvent.collection.createIndex({
    toAddress: 1,
    processed: 1,
  });

  // Notification indexes
  await Notification.collection.createIndex({
    merchantId: 1,
    "meta.invoiceId": 1,
    isRead: 1,
  });
  await Notification.collection.createIndex({
    merchantId: 1,
    isRead: 1,
    createdAt: -1,
  });

  // Merchant indexes
  await Merchant.collection.createIndex({
    apiKeyHash: 1,
    isActive: 1,
  });
  await Merchant.collection.createIndex({
    oauthId: 1,
    isActive: 1,
  });
  await Merchant.collection.createIndex({
    userId: 1,
    isActive: 1,
  });

  console.log("✅ Database indexes created successfully");
}
```

2. **Update Mongoose Schema Definitions** (`packages/database/src/models.ts`)

```typescript
// Add index definitions to schema for future auto-creation
invoiceSchema.index({ invoiceId: 1, status: 1 });
invoiceSchema.index({ merchantId: 1, "metadata.isTestnet": 1, createdAt: -1 });
// ... etc
```

3. **Run Index Creation**

```bash
cd apps/api
pnpm tsx src/scripts/create-indexes.ts
```

**Acceptance Criteria:**

- [ ] All 11 indexes created successfully
- [ ] Query performance improved by >80% (measure with MongoDB profiler)
- [ ] No duplicate indexes created
- [ ] Index size < 10% of collection size

---

### 1.3 Per-Merchant Rate Limiting ⚠️ MEDIUM PRIORITY

**Problem:** Global rate limit (100 req/min) doesn't prevent individual merchants from spamming invoice creation

**Implementation Steps:**

1. **Update Invoice Routes** (`apps/api/src/routes/invoices.ts`)

```typescript
import rateLimit from "@fastify/rate-limit";

// Add merchant-specific rate limiter
server.register(rateLimit, {
  max: 10, // 10 invoices per minute
  timeWindow: "1 minute",
  keyGenerator: (request) => {
    // Use merchant ID if authenticated, otherwise IP
    return request.merchant?._id?.toString() || request.ip;
  },
  allowList: ["127.0.0.1", "::1"], // Whitelist localhost
  errorResponseBuilder: (request, context) => ({
    error: "Too Many Requests",
    message: `Rate limit exceeded. Maximum ${context.max} invoices per minute.`,
    retryAfter: context.after,
  }),
});
```

**Acceptance Criteria:**

- [ ] Merchants limited to 10 invoices/minute
- [ ] Clear error message with retry-after time
- [ ] Localhost exempt for development
- [ ] Rate limit headers included in response

---

### 1.4 Background Job Pagination ⚠️ MEDIUM PRIORITY

**Problem:** Background jobs fetch ALL matching records, causing memory/CPU spikes

**Implementation Steps:**

1. **Update Confirmation Engine** (`apps/api/src/core/confirmation-engine.ts`)

```typescript
public static async expireStaleInvoices(): Promise<number> {
  const BATCH_SIZE = 100;
  let expired = 0;
  let hasMore = true;
  let skip = 0;

  while (hasMore) {
    const staleInvoices = await Invoice.find({
      status: {
        $in: ["pending", "mempool_detected", "confirming", "partially_paid"],
      },
      expiresAt: { $lt: new Date() },
    })
    .limit(BATCH_SIZE)
    .skip(skip);

    if (staleInvoices.length === 0) {
      hasMore = false;
      break;
    }

    for (const invoice of staleInvoices) {
      // ... existing expiration logic ...
    }

    expired += staleInvoices.length;
    skip += BATCH_SIZE;
  }

  return expired;
}
```

2. **Update Webhook Dispatcher** (`apps/api/src/infra/webhook-dispatcher.ts`)

```typescript
public static async dispatchPending(): Promise<number> {
  const BATCH_SIZE = 50;
  const now = new Date();
  let dispatched = 0;
  let skip = 0;

  while (true) {
    const candidates = await Invoice.find({
      webhookDelivered: false,
      webhookAttempts: { $lt: this.MAX_ATTEMPTS },
      status: { $in: ["confirmed", "expired"] },
    })
    .limit(BATCH_SIZE)
    .skip(skip);

    if (candidates.length === 0) break;

    for (const invoice of candidates) {
      // ... existing retry logic ...
    }

    dispatched += candidates.length;
    skip += BATCH_SIZE;

    // Stop if we haven't processed all candidates yet
    // (next run will pick up remaining)
    if (candidates.length < BATCH_SIZE) break;
  }

  return dispatched;
}
```

**Acceptance Criteria:**

- [ ] Background jobs process in batches of 50-100
- [ ] No single job run exceeds 5 seconds
- [ ] Memory usage stable during execution

---

## 📊 Phase 2: Architecture Improvements (Week 2)

**Goal:** Improve scalability and resilience  
**Risk Level:** Medium  
**Estimated Time:** 5-7 days

### 2.1 Redis Distributed Cache

**Problem:** In-memory cache doesn't work in multi-instance deployments

**Implementation Steps:**

1. **Install Redis Dependencies**

```bash
cd apps/api
pnpm add ioredis @types/ioredis
```

2. **Create Redis Client** (`apps/api/src/infra/redis-client.ts`)

```typescript
import Redis from "ioredis";

export class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      this.instance.on("error", (err) => {
        console.error("❌ Redis error:", err);
      });

      this.instance.on("connect", () => {
        console.log("✅ Redis connected");
      });
    }
    return this.instance;
  }
}
```

3. **Update Price Oracle** (`apps/api/src/infra/price-feed.ts`)

```typescript
import { RedisClient } from "./redis-client.js";

export class PriceOracle {
  private static CACHE_TTL_MS = 60; // 1 minute in seconds
  private static CACHE_KEY_PREFIX = "price:";

  public static async getPrice(currency: Currency): Promise<number> {
    const redis = RedisClient.getInstance();
    const cacheKey = `${this.CACHE_KEY_PREFIX}${currency}`;

    // 1. Try Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }
    } catch (err) {
      console.warn("Redis cache read failed, using fallback:", err);
    }

    // 2. Fetch from providers (existing logic)
    const price = await this.fetchWithFailover(currency);

    // 3. Update Redis cache
    try {
      await redis.setex(cacheKey, this.CACHE_TTL_MS, price.toString());
    } catch (err) {
      console.warn("Redis cache write failed:", err);
    }

    return price;
  }

  private static async fetchWithFailover(currency: Currency): Promise<number> {
    // ... existing CoinGecko/Binance failover logic ...
  }
}
```

**Acceptance Criteria:**

- [ ] Price cache shared across API instances
- [ ] Graceful degradation if Redis unavailable
- [ ] Cache hit rate >99%

---

### 2.2 Circuit Breaker for Blockchain Providers

**Problem:** Slow provider responses block invoice processing

**Implementation Steps:**

1. **Install Circuit Breaker Library**

```bash
cd apps/api
pnpm add opossum
```

2. **Create Circuit Breaker Wrapper** (`apps/api/src/infra/circuit-breaker.ts`)

```typescript
import CircuitBreaker from "opossum";

export class ProviderCircuitBreaker {
  private static circuits: Map<string, CircuitBreaker> = new Map();

  public static getCircuit(
    providerName: string,
    operation: (data: any) => Promise<any>,
  ): CircuitBreaker {
    if (!this.circuits.has(providerName)) {
      const circuit = new CircuitBreaker(operation, {
        timeout: 5000, // 5 second timeout
        errorThresholdPercentage: 50, // Open after 50% failures
        resetTimeout: 30000, // Try again after 30 seconds
        volumeThreshold: 5, // Minimum requests before tripping
      });

      circuit.on("open", () => {
        console.warn(`🚫 Circuit OPEN for ${providerName}`);
      });

      circuit.on("close", () => {
        console.log(`✅ Circuit CLOSED for ${providerName} (healthy)`);
      });

      circuit.on("halfOpen", () => {
        console.log(`🟡 Circuit HALF-OPEN for ${providerName} (testing)`);
      });

      this.circuits.set(providerName, circuit);
    }

    return this.circuits.get(providerName)!;
  }
}
```

3. **Update Provider Pool** (`apps/api/src/infra/provider-pool.ts`)

```typescript
import { ProviderCircuitBreaker } from "./circuit-breaker.js";

public async subscribeAddress(
  address: string,
  chain: string,
  webhookUrl: string,
  useDualProvider: boolean = false,
): Promise<{ providerName: string; subscriptionId: string } | null> {
  for (const provider of this.providers) {
    try {
      const circuit = ProviderCircuitBreaker.getCircuit(
        provider.name,
        (data) => provider.subscribeAddress(data.address, data.chain, data.webhookUrl)
      );

      const subId = await circuit.fire({ address, chain, webhookUrl });

      if (subId) {
        return { providerName: provider.name, subscriptionId: subId };
      }
    } catch (err) {
      console.warn(`Provider ${provider.name} failed (circuit open?):`, err);
    }
  }
  return null;
}
```

**Acceptance Criteria:**

- [ ] Providers automatically bypassed after 50% failure rate
- [ ] Automatic recovery after 30 seconds
- [ ] Circuit state logged for monitoring

---

### 2.3 Invoice Creation Parallelization

**Problem:** Sequential operations increase latency

**Implementation Steps:**

1. **Update Invoice Controller** (`apps/api/src/controllers/invoices.controller.ts`)

```typescript
createInvoice: async (request: any, reply: FastifyReply) => {
  try {
    const merchant = request.merchant;
    const {
      amount_usd,
      currency,
      ttl_minutes,
      metadata,
      description,
      is_testnet,
    } = request.body;

    // ✅ Parallelize independent operations
    const [marketPrice, nextIndex] = await Promise.all([
      PriceOracle.getPrice(currency as Currency),
      (async () => {
        const next = merchant.derivationIndex + 1;
        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: { derivationIndex: next },
        });
        return next;
      })(),
    ]);

    // ... rest of invoice creation logic ...

    // ✅ Single atomic invoice creation
    const invoice = await Invoice.create({
      merchantId: merchant._id,
      invoiceId,
      amountUsd: totalAmountUsd,
      cryptoAmount: totalCryptoAmount,
      cryptoCurrency: currency,
      payAddress,
      feeUsd,
      feeCrypto,
      derivationIndex: nextIndex,
      requiredConfirmations,
      expiresAt,
      description,
      metadata: { ...metadata, network: envNetwork, isTestnet },
    });

    // ... response ...
  } catch (err: unknown) {
    // ... error handling ...
  }
};
```

**Acceptance Criteria:**

- [ ] Invoice creation latency reduced by 40-50%
- [ ] No race conditions in derivation index updates
- [ ] Error handling preserved

---

## 📊 Phase 3: Scale Preparations (Week 3)

**Goal:** Prepare for high-traffic production deployment  
**Risk Level:** Medium-High  
**Estimated Time:** 5-7 days

### 3.1 BullMQ Job Queue for Webhooks

**Problem:** Sequential webhook processing doesn't scale

**Implementation Steps:**

1. **Install BullMQ**

```bash
cd apps/api
pnpm add bullmq
```

2. **Create Webhook Queue** (`apps/api/src/infra/webhook-queue.ts`)

```typescript
import { Queue, Worker } from "bullmq";
import { RedisClient } from "./redis-client.js";

export class WebhookQueue {
  private static queue: Queue;
  private static worker: Worker;

  public static init() {
    const connection = RedisClient.getInstance();

    this.queue = new Queue("webhooks", { connection });

    this.worker = new Worker(
      "webhooks",
      async (job) => {
        const { invoiceId, event } = job.data;
        return await WebhookDispatcher.dispatch(invoiceId, event);
      },
      {
        connection,
        concurrency: 10, // Process 10 webhooks in parallel
      },
    );

    this.worker.on("completed", (job) => {
      console.log(`✅ Webhook job ${job.id} completed`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Webhook job ${job?.id} failed:`, err);
    });
  }

  public static async dispatch(
    invoiceId: string,
    event: string,
    priority: "high" | "normal" | "low" = "normal",
  ) {
    const priorities = { high: 1, normal: 5, low: 10 };

    await this.queue.add(
      "webhook",
      { invoiceId, event },
      {
        priority: priorities[priority],
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    );
  }
}
```

3. **Update Webhook Dispatcher** (use queue instead of direct calls)

```typescript
// In confirmation-engine.ts
WebhookQueue.dispatch(invoice.invoiceId, "invoice.confirmed", "high");
```

**Acceptance Criteria:**

- [ ] Webhooks processed in parallel (10 concurrent)
- [ ] Priority queue working (confirmed > expired)
- [ ] Failed jobs automatically retried

---

### 3.2 LRU Cache Eviction

**Problem:** In-memory cache grows unbounded

**Implementation Steps:**

1. **Install LRU Cache Library**

```bash
cd apps/api
pnpm add lru-cache
```

2. **Update Price Oracle** (`apps/api/src/infra/price-feed.ts`)

```typescript
import { LRUCache } from "lru-cache";

export class PriceOracle {
  private static cache = new LRUCache<
    string,
    { price: number; timestamp: number }
  >({
    max: 100, // Max 100 entries
    ttl: 60 * 1000, // 1 minute TTL
    maxSize: 1024 * 1024, // Max 1MB memory
    sizeCalculation: (value) => JSON.stringify(value).length,
  });

  public static async getPrice(currency: Currency): Promise<number> {
    const coinId = this.mapCurrencyToCoinGeckoId(currency);
    const cached = this.cache.get(coinId);

    if (cached) {
      return cached.price;
    }

    // ... fetch logic ...
  }
}
```

**Acceptance Criteria:**

- [ ] Cache size bounded to 100 entries
- [ ] Old entries automatically evicted
- [ ] Memory usage stable under load

---

### 3.3 Prometheus Metrics Integration

**Problem:** No visibility into p95/p99 latencies

**Implementation Steps:**

1. **Update Metrics Configuration** (`apps/api/src/main.ts`)

```typescript
import { collectDefaultMetrics, Counter, Histogram } from "prom-client";

// Create custom metrics
const invoiceCreationLatency = new Histogram({
  name: "invoice_creation_latency_seconds",
  help: "Time to create an invoice",
  buckets: [0.1, 0.25, 0.5, 1, 2, 5],
});

const webhookProcessingLatency = new Histogram({
  name: "webhook_processing_latency_seconds",
  help: "Time to process a webhook",
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2],
});

const activeInvoices = new Gauge({
  name: "active_invoices_total",
  help: "Number of active (non-expired) invoices",
});

// Wrap invoice creation
server.post("/v1/invoices", async (request, reply) => {
  const end = invoiceCreationLatency.startTimer();
  const result = await InvoicesController.createInvoice(request, reply);
  end();
  return result;
});
```

2. **Add Metrics Endpoint** (already exists at `/metrics`)

3. **Create Grafana Dashboard** (optional, for production)

**Acceptance Criteria:**

- [ ] All critical endpoints instrumented
- [ ] Metrics visible at `/metrics` endpoint
- [ ] Alerts configured for p95 > 1s

---

## 📊 Phase 4: Monitoring & Validation (Ongoing)

### 4.1 Performance Testing

**Load Testing Script** (`apps/api/tests/performance/load-test.ts`)

```typescript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "1m", target: 0 }, // Ramp down
  ],
};

export default function () {
  // Test invoice creation
  const createRes = http.post(
    "http://localhost:5050/v1/invoices",
    JSON.stringify({
      amount_usd: 100,
      currency: "BTC",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test_key",
      },
    },
  );

  check(createRes, {
    "invoice creation status is 201": (r) => r.status === 201,
    "invoice creation time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run Load Test:**

```bash
k6 run apps/api/tests/performance/load-test.ts
```

---

### 4.2 Performance Benchmarks

**Before Implementation:**

```bash
# Invoice Creation (p95)
wrk -t12 -c400 -d30s http://localhost:5050/v1/invoices

# Expected: ~800ms latency, ~50 req/s
```

**After Implementation:**

```bash
# Invoice Creation (p95)
wrk -t12 -c400 -d30s http://localhost:5050/v1/invoices

# Target: <200ms latency, ~200 req/s
```

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes

- [ ] 1.1 Incremental Amount Tracking
- [ ] 1.2 Database Index Optimization
- [ ] 1.3 Per-Merchant Rate Limiting
- [ ] 1.4 Background Job Pagination

### Phase 2: Architecture Improvements

- [ ] 2.1 Redis Distributed Cache
- [ ] 2.2 Circuit Breaker for Providers
- [ ] 2.3 Invoice Creation Parallelization

### Phase 3: Scale Preparations

- [ ] 3.1 BullMQ Job Queue
- [ ] 3.2 LRU Cache Eviction
- [ ] 3.3 Prometheus Metrics

### Phase 4: Monitoring & Validation

- [ ] 4.1 Load Testing
- [ ] 4.2 Performance Benchmarks
- [ ] 4.3 Documentation Update

---

## 🎯 Success Metrics

| Metric                 | Before   | After     | Measurement Method       |
| ---------------------- | -------- | --------- | ------------------------ |
| Invoice Creation (p95) | 800ms    | <200ms    | Prometheus histogram     |
| Webhook Processing     | O(n)     | O(1)      | Code complexity analysis |
| DB Query Time (p95)    | 50ms     | <10ms     | MongoDB profiler         |
| Price Cache Hit Rate   | 90%      | >99%      | Redis stats              |
| Max Throughput         | 50 req/s | 200 req/s | Load testing (k6)        |

---

## 🚀 Deployment Plan

### Pre-Deployment

1. Run migration scripts on staging database
2. Deploy to staging environment
3. Run load tests
4. Verify all acceptance criteria

### Production Deployment

1. Deploy during low-traffic window (2-4 AM UTC)
2. Monitor metrics closely for 1 hour
3. Gradually increase traffic (canary deployment)
4. Rollback plan ready (revert to previous tag)

### Post-Deployment

1. Monitor error rates for 24 hours
2. Review performance metrics after 1 week
3. Document learnings
4. Plan next optimization cycle

---

## 📚 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [REVIEW.md](./REVIEW.md) - Architecture review
- [PRICING_MODEL.md](./PRICING_MODEL.md) - Business model

---

## 👥 Responsibilities

| Task                   | Owner        | Reviewer     |
| ---------------------- | ------------ | ------------ |
| Phase 1 Implementation | Backend Team | Tech Lead    |
| Phase 2 Implementation | Backend Team | Tech Lead    |
| Phase 3 Implementation | Backend Team | CTO          |
| Load Testing           | QA Team      | Backend Team |
| Documentation          | Tech Writer  | Backend Team |

---

**Last Updated:** February 26, 2026  
**Next Review:** March 5, 2026
