# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-18

### Added

- **SaaS Architecture** — Automated merchant onboarding via Tatum API for zero-touch blockchain monitoring.
- **Dynamic Checkout** — Next.js 16 consumer payment interface with cyberpunk aesthetic, QR codes, and live countdowns (Port 5051).
- **Merchant Console** — Scaffolded dashboard app for merchants to track volume and system health (Port 5052).
- **Socket.io Integration** — Instant real-time UI updates for payment detection and confirmation across the ecosystem.
- **Reliable Webhook Dispatcher** — Production-grade delivery engine with exponential backoff and persistent retry state.
- **Monetization Engine** — Built-in 0.5% "Tyecode Tax" calculation and tracking on all invoices.
- **Port Isolation** — Standardized ecosystem to a unique port range (5050: API, 5051: Checkout, 5052: Dashboard).
- **Dynamic Versioning** — Ecosystem-wide logic to import version strings directly from individual `package.json` files.
- **Tooling** — Husky, lint-staged, Prettier, ESLint, and Commitlint for high-compliance dev workflows.
- **Monorepo scaffold** — Turborepo + pnpm workspaces with clean `apps/` and `packages/` separation.
- **@tyepay/crypto** — HD wallet derivation engine for BTC (P2WPKH) and EVM (ERC-20) monitoring.
- **@tyepay/database** — MongoDB persistence layer with Mongoose models for Merchant and Invoice lifecycle.
- **Price Oracle** — Real-time USD ↔ crypto conversion with 1-minute caching and stale fallbacks.
- **x402 Protocol** — Native support for agentic payment handshakes via HTTP 402 headers.

### Changed

- **API Engine** — Improved error handling and performance optimizations for the core Knot server.
- **Webhooks** — Enhanced payload security with HMAC signatures and unique event IDs (`evt_...`).

[0.1.0]: https://github.com/tyecode/tyepay/releases/tag/v0.1.0
