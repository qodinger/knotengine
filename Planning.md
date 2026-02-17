# 🚀 Project: TyePay (Code Name: Knot)

> **Minimalist, Non-Custodial Crypto Payment Infrastructure for Humans & AI.**

| Attribute    | Details                         |
| :----------- | :------------------------------ |
| **Brand**    | Tyecode                         |
| **Status**   | 🌗 Phase 3 In-Progress (v0.1.0) |
| **Category** | FinTech / Web3 Infrastructure   |

---

## 📌 Project Overview

TyePay is a **non-custodial** payment gateway designed for modern developers and autonomous agents. Unlike traditional centralist gateways, TyePay never touches a merchant's private keys.

By leveraging **HD Wallet Derivation (BIP44)**, the system generates unique, one-time addresses for every order. This ensures funds flow directly from the customer to the merchant’s cold storage or hardware wallet, eliminating middleman risk.

### 💎 Key Value Propositions

- **🛡️ Zero Custody:** Merchants maintain 100% control. Funds never pass through Tyecode's servers.
- **🕵️ Privacy-First:** No invasive KYC for small-scale developers (Lao E-Trust compliant architecture).
- **🤖 AI-Native:** Industry-leading support for **x402 (HTTP 402)** agentic payments. No LLM costs—pure infrastructure for machines.
- **🧩 Minimalist:** A "plug-and-play" library architecture that avoids project bloat.

---

## 🏗️ Technical Architecture

### 🛠️ The Stack

- **Backend:** Node.js (TypeScript) + Fastify — _Optimized for low-latency request handling._
- **Database:** MongoDB (Core State) + Redis (Real-time Caching).
- **Blockchain Data:** Alchemy / Tatum — _Redundant webhook-based monitoring (Free tier focused)._
- **Frontend:** Next.js + Tailwind CSS — _Cyberpunk-inspired, ultra-minimalist UI._

### 🧠 Core Engine ("Tye")

1.  **Address Derivation:** Uses `bip32` hierarchical deterministic logic to derive child addresses from an extended public key (`xPub`).
2.  **Price Sync:** High-frequency real-time currency conversion via CoinGecko/Binance APIs.
3.  **Webhook Engine:** Securely signs payloads with HMAC to notify merchant backend services of verified transactions.
4.  **Agentic Bridge (x402):** Native support for `HTTP 402 Payment Required` headers, allowing autonomous AI agents to settle invoices without human UI interaction.

---

## 📋 Development Roadmap

### Phase 1: The Cryptographic Core ✅

- [x] **Project Initialization:** Modern Node.js + TypeScript scaffold with rigid linting rules.
- [x] **HD Wallet Setup:** Implement `bip32` and `bitcoinjs-lib` for robust BTC/LTC address generation.
- [x] **EVM Integration:** `ethers.js` integration for USDT/USDC (ERC-20) monitoring on Ethereum/Polygon.
- [x] **x402 Protocol Scaffold:** Define the HTTP 402 header structure for agentic handshakes.
- [x] **Price Feed Service:** Real-time USD ↔ Crypto conversion microservice.
- [x] **Quality Assurance:** Unit test suite (4/4 passed) — BTC derivation, idempotency, EVM derivation, webhook signing.

### Phase 2: Monitoring & Persistence ✅

- [x] **Schema Design:** MongoDB + Mongoose models with enhanced lifecycle tracking (`Merchant`, `Invoice`, `WebhookEvent`).
- [x] **Webhook Listeners:** Alchemy/Tatum webhook routes with HMAC signature verification + dev simulation endpoint.
- [x] **Agentic Testing:** Full x402 agent simulation script (`agent-simulation.ts`) exercising the complete flow.
- [x] **Confirmation Logic:** Configurable block-depth engine with merchant-level policy overrides + auto-expiration.
- [x] **API V1:** Complete invoice lifecycle endpoints (`POST /v1/invoices`, `GET /v1/invoices/:id`, list, cancel).
- [x] **SaaS Onboarding:** Automated xPub subscription with Tatum API on merchant registration.
- [x] **Tyecode Tax:** Built-in 0.5% platform fee calculation and tracking in every invoice.

### Phase 3: Checkout Experience & Webhooks 🌑

- [x] **Dynamic Checkout:** Build a responsive, brandable checkout page with QR code generation (Port 5051).
- [x] **Real-time Updates:** Socket.io integration for instant "Payment Confirmed" UI feedback.
- [x] **Reliable Dispatcher:** Webhook engine featuring exponential backoff and idempotency keys.
- [🌗] **Merchant Console:** Lightweight dashboard for management and analytics (Port 5052).
  - [ ] **Invoices List:** Connect to the API to show real, searchable merchant invoices.
  - [ ] **API Keys Management:** Build the UI to generate and revoke merchant secrets.
  - [ ] **Wallet Strategy:** UI for merchants to set up their `btcXpub` and choose confirmation rules.

### Phase 4: Scaling & Compliance 🌑

- [ ] **Legal Framework:** Register with Lao E-Trust under Tyecode IT Services.
- [ ] **Monetization:** Implement the 0.5% "Tyecode Tax" via auto-routing logic (On-chain settlement).
- [ ] **Ecosystem:** Launch documentation portal and official `@tyecode/pay` NPM package.

---

## 🌐 Port Mapping (Knot Ecosystem)

To avoid conflict with other services, TyePay uses a unique port range:

| Service         | Port | Description                  |
| :-------------- | :--- | :--------------------------- |
| **Knot Engine** | 5050 | Core API & Socket.io Server  |
| **Checkout UI** | 5051 | Customer-facing payment page |
| **Dashboard**   | 5052 | Merchant Console & Stats     |

---

## 🗄️ Database Schema

### `merchants`

Stores merchant settings and public derivation keys.

```javascript
const MerchantSchema = new Schema({
  name: { type: String, required: true },
  apiKeyHash: { type: String, required: true, unique: true },
  btcXpub: { type: String },
  ethAddress: { type: String },
  webhookUrl: { type: String },
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
