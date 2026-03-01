# 💰 KnotEngine Pricing & Monetization Model

> **Last Updated:** February 2026  
> **Philosophy:** Transparent fees, no hidden spreads, enterprise reliability at startup prices.

---

## 📊 Subscription Tiers

| Feature             | **Starter**       | **Professional** | **Enterprise**           |
| :------------------ | :---------------- | :--------------- | :----------------------- |
| **Monthly Cost**    | **$0**            | **$39**          | **$149**                 |
| **Transaction Fee** | **1.0%**          | **0.5%**         | **0.25%**                |
| **Monitoring**      | Single Provider   | Dual-Provider    | Dedicated Infrastructure |
| **Branding**        | "Powered by Knot" | Full White-label | Full White-label         |
| **Reporting**       | Basic Dashboard   | Basic Dashboard  | Basic Dashboard          |
| **Notifications**   | Email             | Email Alerts     | Email Alerts             |
| **Invoice Volume**  | Up to $50K/mo     | Up to $500K/mo   | Custom                   |

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
KnotEngine Fee:      $1.00 (1.0% deducted from credit balance)
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

- **Starter:** 1.0% of invoice amount
- **Professional:** 0.5% of invoice amount
- **Enterprise:** 0.25% of invoice amount

### 3. Subscription Billing (Recurring)

On the same day every month (e.g., the 1st), an internal background job checks the merchant's `plan`:

- If `plan === 'professional'`, subtract **$39.00** from `creditBalance`
- If `plan === 'enterprise'`, subtract **$149.00** from `creditBalance`
- If `creditBalance` falls below zero, the account reverts to the **Starter** tier and the merchant is notified via the Dashboard

---

## 📈 Revenue Comparison (Per Merchant)

| Monthly Volume | **Starter (1.0%)** | **Professional (0.5% + $39)** | Cheapest Plan    |
| :------------- | :----------------- | :---------------------------- | :--------------- |
| **$1,000**     | **$10.00**         | $44.00                        | **Starter**      |
| **$5,000**     | **$50.00**         | $64.00                        | **Starter**      |
| **$7,800**     | **$78.00**         | **$78.00** _(Tie)_            | **Starter/Pro**  |
| **$10,000**    | $100.00            | **$89.00**                    | **Professional** |
| **$20,000**    | $200.00            | **$139.00**                   | **Professional** |
| **$50,000**    | $500.00            | **$289.00**                   | **Professional** |

### Break-Even Analysis

| Upgrade Path              | Break-Even Volume | Monthly Savings at $20K |
| :------------------------ | :---------------- | :---------------------- |
| Starter → Professional    | ~$7,800/mo        | $61/mo                  |
| Professional → Enterprise | ~$44,000/mo       | $111/mo                 |

**Key Strategic Insight:**

- **Professional tier** pays for itself vs. Starter at **$7,800/mo** — typical for established e-commerce
- **Enterprise tier** targets high-volume merchants processing **$50K+/mo**

---

## ✨ Plan Features Explained

### Starter — For New Businesses

**Best for:** Freelancers, startups, testing crypto payments

- ✅ Basic dashboard with real-time analytics
- ✅ Single-provider blockchain monitoring
- ✅ "Powered by KnotEngine" branding
- ✅ Up to $50,000 monthly invoice volume

**No monthly commitment. Pay only for what you process.**

---

### Professional — For Established Businesses

**Best for:** Growing and high-volume merchants, tax-compliant operations

**Everything in Starter, plus:**

- ✅ **Dual-provider monitoring** — Tatum + Alchemy redundancy for 99.9% uptime
- ✅ **Full white-label** — Complete brand control, hide KnotEngine logo
- ✅ **Webhook retries** — Intelligent back-off for failed notifications
- ✅ Up to $500,000 monthly invoice volume

**At $39/mo, this plan pays for itself (vs. Starter) at ~$7,800 monthly volume.**

---

### Enterprise — For High-Volume Operations

**Best for:** Exchanges, marketplaces, payment processors

**Everything in Professional, plus:**

- ✅ **Dedicated infrastructure** — Isolated resources for consistent performance
- ✅ **Custom contract terms** — Net-30 billing, volume discounts
- ✅ **Unlimited volume** — Scale without restrictions

**At $149/mo, this plan pays for itself at ~$44,000 monthly volume.**

**Contact us for custom pricing at $100K+/mo volumes.**

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

| Plan             | Transaction Fee | Monthly Cost | Break-Even Volume | Max Volume (Soft Cap) |
| :--------------- | :-------------- | :----------- | :---------------- | :-------------------- |
| **Starter**      | 1.0%            | $0           | N/A               | $50,000/mo            |
| **Professional** | 0.5%            | $39          | ~$7,800/mo        | $500,000/mo           |
| **Enterprise**   | 0.25%           | $149         | ~$44,000/mo       | Unlimited             |

**Minimum Invoice:** $1.00  
**Minimum Fee:** $0.05 per transaction  
**Invoice TTL:** 30 minutes (default), configurable up to 24 hours

---

## 🔍 Competitive Comparison

| Provider                    | Transaction Fee | Monthly | Withdrawal Fees | Hidden Costs               |
| :-------------------------- | :-------------- | :------ | :-------------- | :------------------------- |
| **KnotEngine Starter**      | **1.0%**        | $0      | None            | None                       |
| **KnotEngine Professional** | **0.5%**        | $39     | None            | None                       |
| Coinbase Commerce           | 1.0%            | $0      | Varies          | Limited cryptos            |
| BitPay                      | 1-2% + $0.25    | $0      | Free            | Fixed fee hurts small txns |
| NOWPayments                 | 0.5-1%          | $0      | Free            | 0.5% swap fee              |
| Coinremitter                | 0.23%           | $0      | Free            | Limited features           |
| BTCPay Server               | 0%              | $0      | Network only    | Self-hosted, no support    |

**KnotEngine Advantage:**

- ✅ No withdrawal fees (stablecoin settlements)
- ✅ No hidden FX spreads
- ✅ <3s payment detection (industry: 5-15 min)
- ✅ Dual-provider failover (industry: single point of failure)
- ✅ Transparent credit-based billing

---

## ❓ Frequently Asked Questions

### What happens if my credit balance runs out?

Your account automatically downgrades to **Starter** tier. You'll receive email notifications at 30 days, 7 days, and 24 hours before this happens.

### Can I switch plans anytime?

Yes. Plan changes take effect immediately. If upgrading, you'll be charged a prorated amount. If downgrading, credits remain in your account.

### Are there volume limits?

Soft caps exist to ensure system stability. If you consistently exceed your tier's limit, we'll reach out about upgrading. Enterprise has no limits.

### What cryptocurrencies can I use to top up?

Currently **USDT** and **USDC** on Polygon, Ethereum, and Base. More networks and stablecoins coming soon.

### Do you charge for refunds?

No. Refunds are processed at no additional cost. The original transaction fee is not refunded.

### Can I get custom pricing?

Yes. Merchants processing **$100,000+/mo** qualify for volume discounts. Contact enterprise@knotengine.com.

---

## 📞 Ready to Get Started?

- **Starter:** [Sign up free](#) — No credit card required
- **Professional:** [Start 14-day trial](#) — Full features, no commitment
- **Enterprise:** [Contact sales](#) — Custom demo and pricing

**Questions?** Join our [Discord community](#) or email support@knotengine.com
