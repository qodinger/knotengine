# 🛒 KnotEngine Checkout

The customer-facing payment interface for the KnotEngine ecosystem.

## ✨ Features

- **Multi-Asset QR Codes** — Supports BTC, LTC, ETH, USDT (ERC-20 & Polygon), and more.
- **Real-time Status** — Live payment detection and confirmation updates via Socket.io.
- **BIP-21 Compatible** — Generates wallet-compatible payment URIs for one-tap mobile payments.
- **Countdowns** — Displays invoice expiration timer to guide customers to pay on time.
- **Store Branding** — Displays the merchant's logo and business name for a professional experience.
- **Responsive** — Fully optimized for mobile wallets and desktop browsers.

## 🚀 Development

```bash
pnpm dev
```

Runs on **Port 5051** by default.

## 🔗 Integration

The checkout page is invoked automatically when an invoice is created via the API. It is accessible at:

```
http://localhost:5051/checkout/[invoiceId]
```

The `invoiceId` is returned in the API response as `checkout_url`.

## 🏗️ Tech Stack

- **Next.js 16** with App Router
- **React 19** + TypeScript
- **Tailwind CSS v4**
- **Socket.io** for real-time payment events
- **qrcode.react** for QR code rendering
