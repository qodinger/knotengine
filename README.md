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

## 🏗️ Project Structure

- `apps/api`: Fastify-based core engine
- `apps/checkout`: Next.js payment interface
- `apps/dashboard`: Next.js merchant console
- `packages/crypto`: Core derivation logic (BIP32/BIP44)
- `packages/database`: Mongoose models and shared DB logic
- `packages/types`: Shared TypeScript definitions
