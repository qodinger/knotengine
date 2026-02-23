# 🚀 KnotEngine

> **Minimalist, Non-Custodial Crypto Payment Infrastructure for Humans.**

| Attribute    | Details                                   |
| :----------- | :---------------------------------------- |
| **Brand**    | KnotEngine                                |
| Status       | ✅ Phase 4: Scaling & Compliance (v0.2.1) |
| **Category** | FinTech / Web3 Infrastructure             |

---

## 📌 Service Overview

KnotEngine is a **non-custodial** payment gateway designed for modern developers and digital merchants. Unlike traditional centralist gateways, KnotEngine never touches a merchant's private keys.

By leveraging **HD Wallet Derivation (BIP44)**, the system generates unique, one-time addresses for every order. This ensures funds flow directly from the customer to the merchant’s cold storage or hardware wallet, eliminating middleman risk.

### 💎 Key Value Propositions

- **🛡️ Zero Custody:** Merchants maintain 100% control. Funds never pass through KnotEngine's servers.
- **🕵️ Privacy-First:** No invasive KYC for small-scale developers.
- **🧩 Minimalist:** A "plug-and-play" library architecture that avoids infrastructure bloat.

---

## 🏗️ Technical Architecture

### 🛠️ The Stack

- **Backend:** Node.js (TypeScript) + Fastify — _Optimized for low-latency request handling._
- **Database:** MongoDB (Core State) + Redis (Real-time Caching).
- **Blockchain Data:** Alchemy / Tatum — _Redundant webhook-based monitoring (Free tier focused)._
- **Frontend:** Next.js + Tailwind CSS — _Cyberpunk-inspired, ultra-minimalist UI._

### 🧠 Core Engine ("Knot")

1.  **Address Derivation:** Uses `bip32` hierarchical deterministic logic to derive child addresses from an extended public key (`xPub`).
2.  **Price Sync:** High-frequency real-time currency conversion via CoinGecko/Binance APIs.
3.  **Webhook Engine:** Securely signs payloads with HMAC to notify merchant backend services of verified transactions.

---

## 📋 Development Roadmap

### Phase 1: The Cryptographic Core ✅

- [x] **Project Initialization:** Modern Node.js + TypeScript scaffold with rigid linting rules.
- [x] **HD Wallet Setup:** Implement `bip32` and `bitcoinjs-lib` for robust BTC/LTC address generation.
- [x] **EVM Integration:** `ethers.js` integration for USDT/USDC (ERC-20) monitoring on Ethereum/Polygon.
- [x] **Price Feed Service:** Real-time USD ↔ Crypto conversion microservice.
- [x] **Quality Assurance:** Unit test suite (8/8 passed) — BTC derivation, idempotency, EVM derivation, webhook signing, SDK functions.

### Phase 2: Monitoring & Persistence ✅

- [x] **Schema Design:** MongoDB + Mongoose models with enhanced lifecycle tracking (`Merchant`, `Invoice`, `WebhookEvent`).
- [x] **Webhook Listeners:** Alchemy/Tatum webhook routes with HMAC signature verification + dev simulation endpoint.
- [x] **Confirmation Logic:** Configurable block-depth engine with merchant-level policy overrides + auto-expiration.
- [x] **API V1:** Complete invoice lifecycle endpoints (`POST /v1/invoices`, `GET /v1/invoices/:id`, list, cancel).
- [x] **SaaS Onboarding:** Automated xPub subscription with Tatum API on merchant registration.
- [x] **KnotEngine Fee:** Built-in 1.0% platform fee calculation and tracking in every invoice.

### Phase 3: Checkout Experience & Webhooks ✅

- [x] **Dynamic Checkout:** Build a responsive, brandable checkout page with QR code generation (Port 5051).
- [x] **Real-time Updates:** Socket.io integration for instant "Payment Confirmed" UI feedback.
- [x] **Reliable Dispatcher:** Webhook engine featuring exponential backoff and idempotency keys.
- [x] **Merchant Console:** Lightweight dashboard for management and analytics (Port 5052).
  - [x] **Invoices List:** Connect to the API to show real, searchable merchant invoices.
  - [x] **API Keys Management:** Build the UI to generate and revoke merchant secrets (`knot_sk_...`).
  - [x] **Webhook Secrets:** Show/Rotate signing secrets (`knot_wh_...`) for verify incoming notifications.
  - [x] **Wallet Strategy:** UI for merchants to set up their `btcXpub` and choose confirmation rules.

### Phase 4: Scaling & Compliance ✅

**Focus:** Validation of the "Stateless" Developer-First Model.

- [x] **Infrastructure Hardening:** Git hooks (Husky, Commitlint) and rigid linting.
- [x] **API Refinement:** Standardized `KnotClient` SDK and added `/docs` Swagger documentation.
- [x] **Licensing Shift:** Migrated the entire monorepo from MIT to **AGPL-3.0 (strong copyleft)** to protect the business model.
- [x] **API Enhancements:** Added `checkout_url` to invoice responses for easier integration.
- [x] **Auth Integration:** Wired up Login/Register UI to backend (API Key Based).
- [x] **Testnet Beta:** Launched public testnet with faucet support.
- [x] **Two-Factor Authentication (2FA):** Implemented TOTP-based security flow for merchant accounts.
- [ ] **Legal Framework:** Register under KnotEngine IT Services.
- [x] **Monetization Engine (V1):** Implemented multi-tier logic (Free, Pro, Enterprise) with plan-aware fees.
- [x] **Stablecoin-Only Billing:** Pivoted platform revenue to only accept USDT/USDC to eliminate volatility for "The Float".
- [x] **Spread Recapture:** Implemented 1.0% auto-conversion spread for Starter accounts to cover infra costs.
- [x] **Ecosystem:** Launch documentation portal and official `@qodinger/knot-sdk` npm package.
- [x] **Live Dashboard Notifications:** Implement real-time events via Socket.io.
- [x] **Database Optimization:** Implemented 30-day TTL indexes for logs and notifications.

### Phase 5: Growth & Advanced Tools (Next Up) 🔮

**Focus:** Enhancing power-user tools for independent merchants.

- [ ] **Merchant Billing UI:** Build the Dashboard tab for upgrading plans (Pro/Enterprise) and topping up credits.
- [ ] **Spread Toggle UI:** Implement the setting for Pro/Enterprise merchants to disable the 1% spread.
- [ ] **Reporting & Accounting:** Generate monthly revenue reports and CSV/JSON exports for taxes.
- [ ] **Mobile Optimization:** Progressive Web App (PWA) for managing merchants on mobile devices.
- [ ] **External Notifications:** Implement email and Telegram alerts for security and payment events.
- [ ] **Audit Logs:** Personal audit trail to track account changes and security events.
- [ ] **Affiliate Integration:** Launch "Partner Program" to earn commissions from Ledger, Trezor, and MoonPay.
- [ ] **Staking Engine (V1):** Enable merchants to stake settled ETH/LTC directly from the dashboard via non-custodial proxies (5-10% commission).
- [ ] **Auto-Stake:** Implementation of "Auto-Stake" button for seamless, hands-free yield generation on every payout.

### Phase 6: Launch & Public Identity 🚀

**Focus:** Converting the infrastructure into a consumer-ready brand.

- [ ] **Marketing Landing Page:** Build a premium, high-conversion homepage at `knotengine.com`.
- [ ] **Legal Portal:** Implement `/terms` and `/privacy` pages with non-custodial protection clauses.
- [ ] **Documentation Portal:** Create a dedicated docs site (e.g., `docs.knotengine.com`) with integration guides.
- [ ] **SEO Optimization:** Finalize metadata, sitemaps, and robots.txt for all public routes.
- [ ] **Deployment:** Final production deployment to cloud infrastructure.

---

## 🎯 Success Metrics

- **⚡ Speed:** < 3 seconds for transaction detection from mempool.
- **💎 Reliability:** 99.99% Webhook delivery success rate.
- **📈 Adoption:** 10+ Production merchants within Q1.

---

## 📈 Revenue Comparison (Per Merchant)

| Method                    | Est. Monthly Revenue     | Effort Level                     |
| :------------------------ | :----------------------- | :------------------------------- |
| **Transaction Fees (1%)** | $10,000                  | Passive (Built-in)               |
| **SaaS Subscriptions**    | $2,000 - $5,000          | Medium (Needs UI work)           |
| **Exchange Spread (2%)**  | $20,000                  | High (Needs exchange API)        |
| **The Float (Yield)**     | **3-5% APY on Balances** | **Passive (Asset Management)**   |
| **Partner Kickbacks**     | **10-15% Revenue Share** | **Passive (Affiliate Links)**    |
| **Staking Commission**    | **5-10% Of User Yield**  | **Passive (Yield-as-a-Service)** |

---

## 🏦 "The Float" (DeFi Yield Strategy)

Since KnotEngine uses a prepaid **Credit Balance** system, the platform effectively holds a pool of merchant funds.

- **Strategy:** Aggregated fee credits are held in yield-bearing assets via **Aave (V3)** on Polygon. This maintains our non-custodial ethos while generating platform revenue.
- **Profit:** The platform retains 100% of the interest generated by the float, while merchants spend their balance at a 1:1 USD value.
- **Benefit:** This creates a "Risk-Free" revenue stream that is fully transparent and on-chain.
- **Tracking:** Individual merchant contributions to the float yield are tracked via `yieldAccruedUsd` for platform analytics.

---

## 🥩 KnotEngine Staking (Yield-as-a-Service)

KnotEngine transforms from a "payment pipe" into a "yield-bearing hub" by offering merchants the ability to put their settled funds to work without giving up custody.

- **Non-Custodial Architecture:** Merchants interact with KnotEngine-verified staking proxies (Lido, Kiln). KnotEngine never holds the private keys; it only facilitates the interaction and signs the reward-sharing logic.
- **Monetization:** KnotEngine takes a **5-10% commission** automatically from the _yield_ generated, not the principal.
- **Auto-Stake Logic:** Merchants can toggle "Auto-Stake" to automatically route 100% of settled payouts into yield-bearing contracts, eliminating capital idleness.
- **Multi-Asset Support:** Native staking for ETH (Lido/RocketPool) and institutional yield for LTC (via DeFi bridges).

---

## 🤝 The Ecosystem (Affiliate Strategy)

Generate secondary revenue by solving merchant pain points through trusted partners:

1.  **🏦 Off-Ramping:** Integrate a "Withdraw to Bank" button via **MoonPay** or **Banxa**. Earn a commission for every transaction routed from our dashboard.
2.  **🛡️ Security Upsell:** Place "Secure your funds" links for **Ledger** or **Trezor** hardware wallets. Ideal for new merchants setting up their first `xPub`.
3.  **⚖️ Tax Compliance:** Partner with **Koinly** or **CoinTracker** to offer "One-Click Accounting" for KnotEngine transaction logs.

---

## 🌐 Port Mapping (Knot Ecosystem)

To avoid conflict with other services, KnotEngine uses a unique port range:

| Service         | Port | Description                  |
| :-------------- | :--- | :--------------------------- |
| **KnotEngine**  | 5050 | Core API & Socket.io Server  |
| **Checkout UI** | 5051 | Customer-facing payment page |
| **Dashboard**   | 5052 | Merchant Console & Stats     |

---

## 🗄️ Database Schema

### `merchants`

Holds merchant settings and public derivation keys.

```javascript
const MerchantSchema = new Schema({
  name: { type: String, required: true },
  apiKeyHash: { type: String, required: true, unique: true }, // Hashed version of knot_sk_...
  btcXpub: { type: String },
  ethAddress: { type: String },
  webhookUrl: { type: String },
  webhookSecret: { type: String }, // knot_wh_... for HMAC signing
  createdAt: { type: Date, default: Date.now },
});
```

### `invoices`

Tracks individual payment requests and their lifecycle.

```javascript
const InvoiceSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  amountUsd: { type: Number, required: true },
  cryptoAmount: { type: Number, required: true },
  cryptoCurrency: { type: String, required: true },
  payAddress: { type: String, required: true, unique: true },
  status: { type: String, default: "pending" },
  expiresAt: { type: Date, required: true },
  txHash: { type: String },
  metadata: { type: Schema.Types.Mixed },
});
```

---

## ⚖️ Compliance Tracker (Laos 2026)

- **Business Category:** Software and Information Technology Services.
- **Regulation:** Instruction No. 0479/MOIC (E-Commerce Licensing).
- **Security Protocol:** Strictly no storage of private keys or seed phrases. All derivation is performed using `xPub`.

---

## 🎯 Success Metrics

- **⚡ Speed:** < 3 seconds for transaction detection from mempool.
- **💎 Reliability:** 99.99% Webhook delivery success rate.
- **📈 Adoption:** 10+ Production merchants within Q1.
