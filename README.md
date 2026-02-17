# 🚀 TyePay (Code Name: Knot)

Minimalist, Non-Custodial Crypto Payment Infrastructure for Humans.

## 🛠️ Prerequisites

Ensure you have the following installed:

- **Node.js**: v18 or later
- **pnpm**: `npm install -g pnpm`
- **Docker**: For running MongoDB and Redis locally

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys (especially `DATABASE_URL` if not using local Docker Mongo).

### 3. Start Infrastructure (Background)

This starts MongoDB and Redis via Docker Compose.

```bash
pnpm docker:up
```

### 4. Launch Services

You can run everything at once:

```bash
pnpm dev
```

Or run services individually:

- **Knot Engine (API)**: `pnpm dev:api` (Port 5050)
- **Checkout UI**: `pnpm dev:checkout` (Port 5051)
- **Merchant Dashboard**: `pnpm dev:dashboard` (Port 5052)

## 📡 Port Mapping

| Service         | Port | Description                  |
| :-------------- | :--- | :--------------------------- |
| **Knot Engine** | 5050 | Core API & Socket.io Server  |
| **Checkout UI** | 5051 | Customer-facing payment page |
| **Dashboard**   | 5052 | Merchant Console & Stats     |

## 🧪 Testing & Simulation

- **Run Unit Tests**: `pnpm test`

## 🛒 Merchant Workflow

TyePay is designed to be integrated into any application in under 5 minutes.

### 1. Register as a Merchant

Send a `POST` request to the API to get your unique credentials:

```bash
curl -X POST http://localhost:5050/v1/merchants \
  -H "Content-Type: application/json" \
  -d '{ "name": "My Store", "btcXpub": "[Your tpub/xpub]" }'
```

Take note of your `apiKey`.

### 2. Create an Invoice

When a customer is ready to pay, generate an invoice:

```bash
curl -X POST http://localhost:5050/v1/invoices \
  -H "x-api-key: [YOUR_API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{ "amount_usd": 49.99, "currency": "BTC" }'
```

You will receive a `pay_address` and a `checkout_url`.

### 3. Redirect the Customer

Redirect your user to the `checkout_url` provided. This page handles the QR code display, live price updates, and real-time payment detection via WebSockets.

### 4. Receive Funds & Notifications

- **Funds**: Go directly to the wallet associated with your `xpub`. TyePay is non-custodial.
- **Notifications**: Once confirmed on-chain, TyePay sends an HMAC-signed webhook to your `webhookUrl` (configurable in merchant settings).

---

## 🏗️ Project Structure

- `apps/api`: Fastify-based core engine
- `apps/checkout`: Next.js payment interface
- `apps/dashboard`: Next.js merchant console
- `packages/crypto`: Core derivation logic (BIP32/BIP44)
- `packages/database`: Mongoose models and shared DB logic
- `packages/types`: Shared TypeScript definitions
