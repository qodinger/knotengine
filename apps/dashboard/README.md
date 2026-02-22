# 📊 KnotEngine Dashboard

The professional merchant command center for the KnotEngine ecosystem.

## ✨ Features

- **Payments** — Real-time monitoring of all incoming invoices with status filters.
- **Analytics & Balances** — Track volume, balances, and performance per asset.
- **Developer Tools** — Manage API keys, rotate webhook secrets, run payment simulations.
- **Activity Log** — Full audit trail of all merchant events with 30-day retention.
- **Settings** — Configure business profile, settlement wallets, fees, 2FA, and more.

## 🚀 Development

```bash
pnpm dev
```

Runs on **Port 5052** by default.

## 🔒 Security

All dashboard actions are proxied through a server-side API layer. Your `knot_sk_` secret key **never leaves the server** and is never exposed to the browser.

## 🏗️ Tech Stack

- **Next.js 16** with App Router
- **React 19** + TypeScript
- **Tailwind CSS v4** + shadcn/ui components
- **Socket.io** for real-time payment updates
- **next-auth v5** for secure session management
