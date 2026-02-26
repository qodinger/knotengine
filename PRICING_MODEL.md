# 💰 KnotEngine Pricing & Monetization Model

This document outlines the transparent pricing strategy for KnotEngine. Revenue is generated via **Transaction Fees** and **SaaS Subscriptions**, both settled using the platform's native **Credit Balance** system (no bank or Stripe required).

---

## 📊 Subscription Tiers

| Feature             | **Starter (Free)** | **Professional**          | **Enterprise**          |
| :------------------ | :----------------- | :------------------------ | :---------------------- |
| **Monthly Cost**    | **$0.00**          | **$29.00**                | **$99.00**              |
| **Transaction Fee** | **1.5%**           | **0.75%**                 | **0.5%**                |
| **Monitoring**      | Single Provider    | Dual-Provider (Redundant) | Priority Monitoring     |
| **Branding**        | "Powered by Knot"  | **Custom (Hidden Logo)**  | Full White-label        |
| **Staff Accounts**  | 2                  | Up to 5 Staff             | Unlimited Staff         |
| **Reporting**       | Basic Dashboard    | Advanced CSV/Tax Export   | API-driven Reports      |
| **Support**         | Community / GitHub | Email (1-2 business days) | Email + Onboarding Call |

---

## 💎 Transparent Pricing Philosophy

KnotEngine believes in **complete fee transparency**. What you see is what you pay — no hidden spreads, no recapture mechanics, no surprises.

### How It Works

1. **Customer Pays Exact Invoice Amount** — The crypto amount quoted is exactly what the customer pays
2. **Merchant Receives Full Amount** — 100% of the invoice value goes to the merchant's wallet
3. **Platform Fee Deducted from Credits** — KnotEngine's fee is transparently deducted from the merchant's prepaid credit balance

### Example ($100 Invoice on Starter Plan)

```
Invoice Amount:      $100.00
Customer Pays:       $100.00 (exact crypto equivalent)
Merchant Receives:   $100.00 (direct to wallet)
KnotEngine Fee:      $1.50 (1.5% deducted from credit balance)
─────────────────────────────────────────────────────
Merchant Net:        $100.00 (full value received)
```

**Result:** Simple, transparent, and auditable. Merchants always know exactly what they're paying.

---

## 🛠️ How It Works (The Credit Balance Engine)

### 1. The Prepaid Model (Stablecoin Focused)

Merchants "Top Up" their account using **Stablecoins (USDT or USDC)** on supported EVM networks (Polygon, Ethereum, Base). The engine converts the confirmed on-chain transaction into **USD Credits** at a 1:1 ratio.

> **Why Stablecoins?** To ensure the stability of merchant credits and predictable fee deductions, KnotEngine only accepts stable value assets for billing purposes.

### 2. Automated Fee Deduction

Whenever a checkout is successful, the engine calculates the fee (based on the merchant's plan) and subtracts it from the `creditBalance`:

- **Starter:** 1.5% of invoice amount
- **Professional:** 0.75% of invoice amount
- **Enterprise:** 0.5% of invoice amount

### 3. Subscription Billing (Recurring)

On the same day every month (e.g., the 1st), an internal background job checks the merchant's `plan`:

- If `plan === 'professional'`, subtract **$29.00** from `creditBalance`
- If `creditBalance` falls below zero, the account reverts to the **Starter** tier and the merchant is notified via the Dashboard

---

## 📈 Revenue Comparison (Per Merchant)

| Monthly Volume | **Starter Profit (1.5%)** | **Professional Profit (0.75% + $29)** |
| :------------- | :------------------------ | :------------------------------------ |
| **$1,000**     | $15.00                    | $36.50                                |
| **$5,000**     | $75.00                    | $66.50                                |
| **$10,000**    | $150.00                   | **$104.00 (Cheaper for Merchant)**    |
| **$20,000**    | $300.00                   | **$179.00 (Cheaper for Merchant)**    |

**Key Strategic Insight:** By processing more than **$7,700** in a month, a merchant actually **saves money** by paying you a subscription. This incentivizes high-volume users to move to a paid plan, giving you stable monthly revenue.

---

## ✨ Planned "Pro" Features

To make the **$29/mo** price point attractive beyond just the fee discount:

- **Historical Tax Reports:** Auto-calculate the fiat price of every crypto sale for local tax compliance
- **Webhook Retries:** Intelligent back-off and manual retry buttons for failed server notifications
- **Slack/Discord/Telegram Notifications:** Get instant alerts where you actually work
- **Merchant Directory:** Optional listing on the "KnotEngine Verified" directory to drive traffic to their store
- **Priority Inbox:** Enterprise merchants receive priority response in support queue

---

## 🤝 Why Transparent Pricing Wins

| Benefit                     | Description                                                              |
| :-------------------------- | :----------------------------------------------------------------------- |
| **Trust**                   | Merchants know exactly what they're paying — no hidden fees or surprises |
| **Compliance**              | Meets consumer protection requirements in most jurisdictions             |
| **Simplicity**              | Easy to understand, easy to explain, easy to audit                       |
| **Competitive Advantage**   | Most crypto payment gateways hide fees in spreads — we don't             |
| **Long-term Relationships** | Transparency builds loyalty and reduces churn                            |

---

## ⚡ Performance & Reliability (v0.4.0+)

KnotEngine's infrastructure investments directly benefit merchants through faster processing and higher reliability.

### Performance Metrics

| Metric                | Performance                 | Merchant Benefit                         |
| --------------------- | --------------------------- | ---------------------------------------- |
| **Invoice Creation**  | <400ms (p95)                | Faster checkout experience for customers |
| **Payment Detection** | <3 seconds from mempool     | Real-time payment confirmation           |
| **Webhook Delivery**  | 500+ req/s parallel         | Reliable server notifications            |
| **Price Updates**     | 99%+ cache hit rate         | Accurate, up-to-date pricing             |
| **Provider Failover** | Automatic (circuit breaker) | Zero downtime during provider outages    |

### Infrastructure Features

- **Dual-Provider Monitoring** (Professional+) — Tatum + Alchemy redundancy
- **Circuit Breakers** — Automatic failover if blockchain providers are unavailable
- **Queue-Based Delivery** — Parallel webhook processing (10 concurrent)
- **Distributed Caching** — Redis-backed price feeds with LRU fallback
- **24/7 Monitoring** — 20+ Prometheus metrics tracking system health

**Result:** Merchants get enterprise-grade reliability at startup prices.

---

## 📋 Fee Schedule Summary

| Plan             | Transaction Fee | Monthly Cost | Break-even Volume |
| :--------------- | :-------------- | :----------- | :---------------- |
| **Starter**      | 1.5%            | $0           | N/A               |
| **Professional** | 0.75%           | $29          | ~$7,700/mo        |
| **Enterprise**   | 0.5%            | $99          | ~$18,700/mo       |

**Minimum Invoice:** $1.00  
**Minimum Fee:** $0.05 per transaction  
**Invoice TTL:** 30 minutes (default), configurable up to 24 hours
