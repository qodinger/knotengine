# 🚀 KnotEngine

**Minimalist, Non-Custodial Crypto Payment Infrastructure for Humans.**

[![Version](https://img.shields.io/badge/version-0.2.1-blue.svg)](https://github.com/qodinger/knotengine/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-9.0.0-orange.svg)](https://pnpm.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

KnotEngine is a professional-grade, open-source crypto payment gateway. It lets developers accept Bitcoin, Ethereum, and stablecoins without ever losing custody of their private keys. Every invoice generates a unique on-chain address — funds flow directly to your wallet, never through KnotEngine's servers.

---

## ✨ Features

- **🛡️ 100% Non-Custodial** — HD Wallet derivation (BIP44) sends funds straight to your cold or hot wallet.
- **🔐 Enterprise-Grade Security** — Two-Factor Authentication (TOTP), `mid_` prefixed Merchant IDs, and HMAC-signed webhooks.
- **🚥 High Availability** — Dual-provider blockchain monitoring (Tatum + Alchemy) with automatic failover.
- **📊 Professional Dashboard** — Modular Next.js merchant console with real-time Analytics and Activity History.
- **⚡ Instant Alerts** — Mempool detection and confirmation notifications pushed instantly via Socket.io.
- **🔌 Developer-First SDK** — Typed `@qodinger/knot-sdk` with full TypeScript support.
- **🧹 Automatic Cleanup** — 30-day TTL policy on notification and webhook event collections keeps your database lean.

---

## 🛠️ Prerequisites

- **Node.js** v20 or later
- **pnpm** `npm install -g pnpm`
- **Docker** (for running MongoDB and Redis locally)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/qodinger/knotengine.git
cd knotengine
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable          | Description                           |
| :---------------- | :------------------------------------ |
| `DATABASE_URL`    | MongoDB connection string             |
| `TATUM_API_KEY`   | Tatum provider key (primary monitor)  |
| `ALCHEMY_API_KEY` | Alchemy key (EVM redundancy provider) |
| `JWT_SECRET`      | Random secret for session signing     |
| `INTERNAL_SECRET` | Shared secret between API & Dashboard |

### 3. Start Infrastructure

```bash
pnpm docker:up
```

This starts **MongoDB** and **Redis** via plain Docker containers (no Compose required).

### 4. Launch All Services

```bash
pnpm dev
```

Or run services individually:

| Command              | Service     | Port |
| :------------------- | :---------- | :--- |
| `pnpm dev:api`       | API Engine  | 5050 |
| `pnpm dev:checkout`  | Checkout UI | 5051 |
| `pnpm dev:dashboard` | Dashboard   | 5052 |

---

## 📡 Port Mapping

| Service         | Port | Description                  |
| :-------------- | :--- | :--------------------------- |
| **API Engine**  | 5050 | Core API & Socket.io Server  |
| **Checkout UI** | 5051 | Customer-facing payment page |
| **Dashboard**   | 5052 | Merchant Console & Analytics |

---

## 🛒 Integration Guide

### 1. Set Up Your Merchant Account

Open the **Dashboard** at `http://localhost:5052`, register, and configure:

- Your settlement wallet address (BTC xPub or EVM address)
- Your webhook endpoint URL
- Two-Factor Authentication (optional but recommended)

### 2. Install the SDK

```bash
npm install @qodinger/knot-sdk
# or
pnpm add @qodinger/knot-sdk
```

### 3. Create an Invoice

```javascript
import { KnotClient } from "@qodinger/knot-sdk";

const knot = new KnotClient({
  apiKey: "knot_sk_your_api_key",
  baseUrl: "http://localhost:5050", // default for dev
});

const invoice = await knot.createInvoice({
  amount_usd: 49.99,
  currency: "BTC",
  metadata: { orderId: "order_abc123" },
});

// Redirect customer to the hosted checkout page
console.log(invoice.checkout_url);
```

### 4. Verify Webhooks

```javascript
const isValid = knot.verifyWebhook(rawBody, signature);
if (!isValid) return res.status(401).send("Invalid signature");
```

---

## 🧪 Testing & Simulation

Run the full test suite:

```bash
pnpm test
```

To test local webhooks via a public tunnel:

```bash
pnpm tunnel  # Uses cloudflared to expose localhost:5050
```

Use the **Simulator** tab in the Dashboard to trigger test payment events (Mempool → Confirming → Confirmed) against any active testnet invoice.

---

## 🏗️ Project Structure

```
knotengine/
├── apps/
│   ├── api/          # Fastify-based payment engine (Port 5050)
│   ├── checkout/     # Next.js customer payment interface (Port 5051)
│   └── dashboard/    # Next.js merchant console (Port 5052)
└── packages/
    ├── crypto/       # BIP32/BIP44 HD wallet derivation engine
    ├── database/     # Mongoose models with TTL auto-pruning
    ├── types/        # Shared TypeScript definitions
    └── sdk/          # Official @qodinger/knot-sdk
```

---

## 🤝 Contributing

Contributions are welcome! Please follow [Conventional Commits](https://www.conventionalcommits.org) for all commit messages — enforced via `commitlint`.

```bash
git checkout -b feat/my-feature
# ... make changes ...
git commit -m "feat(api): add support for Lightning Network"
git push origin feat/my-feature
```

Open a Pull Request to the `main` branch.

---

## 📄 License

KnotEngine is licensed under the [GNU Affero General Public License v3.0](LICENSE).
