# 🚀 Project: TyePay (Code Name: Knot)

> **Minimalist, Non-Custodial Crypto Payment Infrastructure for Humans & AI.**

| Attribute    | Details                       |
| :----------- | :---------------------------- |
| **Brand**    | Tyecode                       |
| **Status**   | 🌑 Planning Phase (v0.1.0)    |
| **Category** | FinTech / Web3 Infrastructure |

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

### Phase 2: Monitoring & Persistence 🌑

- [ ] **Schema Design:** Deploy MongoDB container with Mongoose models.
- [ ] **Webhook Listeners:** Integrate Alchemy/Tatum webhooks to track transaction state transitions.
- [ ] **Agentic Testing:** Simulate an AI agent paying an invoice via x402 headers without a browser.
- [ ] **Confirmation Logic:** Implement configurable block-depth checks (e.g., 2 blocks for BTC/LTC).
- [ ] **API V1:** Create robust endpoints for invoice lifecycle management (`POST /v1/invoices`).

### Phase 3: Checkout Experience & Webhooks 🌑

- [ ] **Dynamic Checkout:** Build a responsive, brandable checkout page with QR code generation.
- [ ] **Real-time Updates:** Socket.io integration for instant "Payment Confirmed" UI feedback.
- [ ] **Reliable Dispatcher:** Webhook engine featuring exponential backoff and idempotency keys.
- [ ] **Merchant Console:** Lightweight dashboard for managing API keys and viewing volume metrics.

### Phase 4: Scaling & Compliance 🌑

- [ ] **Legal Framework:** Register with Lao E-Trust under Tyecode IT Services.
- [ ] **Monetization:** Implement the 0.5% "Tyecode Tax" via auto-routing logic.
- [ ] **Ecosystem:** Launch documentation portal and official `@tyecode/pay` NPM package.

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
