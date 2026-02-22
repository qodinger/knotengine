# 💰 KnotEngine Pricing & Monetization Model

This document outlines the planned multi-tier pricing strategy for KnotEngine. Revenue is generated via a combination of **Transaction Fees** and **SaaS Subscriptions**, both of which are settled using the platform's native **Credit Balance** system (no bank or Stripe required).

---

## 📊 Subscription Tiers

| Feature             | **Starter (Free)** | **Professional**          | **Enterprise**        |
| :------------------ | :----------------- | :------------------------ | :-------------------- |
| **Monthly Cost**    | **$0.00**          | **$29.00**                | **$99.00**            |
| **Transaction Fee** | **1.0%**           | **0.5%**                  | **0.25%**             |
| **Spread (1%)**     | **Always ON**      | **Optional (Toggle)**     | **Optional (Toggle)** |
| **Monitoring**      | Single Provider    | Dual-Provider (Redundant) | Priority Monitoring   |
| **Branding**        | "Powered by Knot"  | **Custom (Hidden Logo)**  | Full White-label      |
| **Staff Accounts**  | 1 (Owner only)     | Up to 3 Staff             | Unlimited Staff       |
| **Reporting**       | Basic Dashboard    | Advanced CSV/Tax Export   | API-driven Reports    |
| **Support**         | Community / GitHub | Email Support             | 24h Priority Support  |

---

## 💎 The "Spread" Optimization (Hidden Revenue)

KnotEngine uses an intelligent **Spread Recapture** system to increase profit margins without increasing visible fees.

### 1. The Strategy

- **Customer Quote:** The customer is shown a "Buy Price" (Market Price - Spread Rate).
- **Payment:** The customer pays slightly more crypto than the base invoice amount.
- **Reception:** Because KnotEngine is non-custodial, the merchant receives this extra crypto directly.
- **Recapture:** KnotEngine detects the extra USD value received by the merchant and deducts it from their **Credit Balance** as part of the transaction fee.

### 2. Example ($100 Invoice with 1% Fee + 1% Spread)

- **Market Price:** 1 BTC = $60,000
  - **Quoted Price:** 1 BTC = $59,400 (1% spread)
  - **Customer Pays:** 0.0016835 BTC ($101.01 market value)
  - **Deduction:** $1.00 (Fee) + $1.01 (Spread Recapture) = **$2.01**
  - **Merchant Net:** **$99.00** (Full value after standard 1% fee)

**Result:** You make **2.01%** on the transaction while the merchant only sees a standard **1%** deduction from their dashboard credits.

---

## 🛠️ How it Works (The "Crypto-SaaS" Engine)

### 1. The Prepaid Model (Stablecoin Focused)

Merchants "Top Up" their account using **Stablecoins (USDT or USDC)** on supported EVM networks (Polygon, Ethereum, Base). The engine converts the confirmed on-chain transaction into **USD Credits** at a 1:1 ratio.

> **Why Stablecoins?** To ensure the stability of the "Yield Pool" and the security of merchant credits, KnotEngine only accepts stable value assets for billing purposes.

### 2. Automated Fee Deduction

Whenever a checkout is successful, the engine calculates the fee (based on the merchant's plan) and subtracts it from the `creditBalance`.

### 3. Subscription Billing (Recurring)

On the same day every month (e.g., the 1st), an internal background job checks the merchant's `plan`.

- If `plan === 'professional'`, subtract **$29.00** from `creditBalance`.
- If `creditBalance` falls below zero, the account reverts to the **Starter** tier and notify the merchant via the Dashboard.

---

## 📈 Revenue Comparison (Per Merchant)

| Monthly Volume | **Starter Profit (1%)** | **Professional Profit (0.5% + $29)** |
| :------------- | :---------------------- | :----------------------------------- |
| **$1,000**     | $10.00                  | $34.00                               |
| **$5,000**     | $50.00                  | $54.00                               |
| **$10,000**    | $100.00                 | **$79.00 (Cheaper for Merchant)**    |
| **$20,000**    | $200.00                 | **$129.00 (Cheaper for Merchant)**   |

**Key Strategic Insight:** By processing more than **$6,000** in a month, a merchant actually **saves money** by paying you a subscription. This incentivizes high-volume users to move to a paid plan, giving you stable monthly revenue.

---

## ✨ Planned "Pro" Features

To make the **$29/mo** price point attractive beyond just the fee discount:

- **Historical Tax Reports:** Auto-calculate the fiat price of every crypto sale for local tax compliance.
- **Webhook Retries:** Intelligent back-off and manual retry buttons for failed server notifications.
- **Slack/Discord/Telegram Notifications:** Get instant alerts where you actually work.
- **Merchant Directory:** Optional listing on the "KnotEngine Verified" directory to drive traffic to their store.

---

## 🏦 "The Float" (Passive Margin Booster)

Since KnotEngine uses a prepaid **Credit Balance** system, the platform effectively holds a custodial pool of capital intended for fees. This creates an additional, risk-free revenue stream:

- **Strategy:** Aggregated fee credits held in the platform's collection wallets are moved into yield-bearing DeFi protocols (e.g., Aave, Compound, or stETH).
- **Profit:** You retain **100% of the interest** (3-12% APY) while merchants spend their balance at full 1:1 USD value.
- **Scaling:** At $1M in total merchant credits, this passive yield adds **$3,000 - $10,000/mo** in profit with no additional transaction overhead.

### 🔬 Suggested DeFi Protocols (Yield Sources)

| Protocol           | Asset Type              | Typical Yield (Est.) | Risk Level |
| :----------------- | :---------------------- | :------------------- | :--------- |
| **Lido (stETH)**   | Ethereum (ETH)          | 3% - 4% APY          | Low        |
| **Aave / Morpho**  | Stablecoins (USDT/USDC) | 4% - 8% APY          | Low        |
| **Spark Protocol** | DAI / Stablecoins       | 5% - 10% APY         | Medium     |
| **Ethena (sUSDe)** | Synthetic Dollars       | 10% - 20% APY        | High       |

_Note: The platform should use a "Core/Satellite" strategy, keeping 80% of funds in Low-risk protocols (Lido/Aave) and 20% in Medium/High yield buffers._
