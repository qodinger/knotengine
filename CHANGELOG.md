# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Automatic Cleanup** — Implemented 30-day Retention (TTL) Policy for `WebhookEvent` and `Notification` collections to prevent database bloat.
- **Real-time Notifications** — Production-ready alerts for payments, expirations, and webhook failures via Socket.io.
- **Organization Migration** — Relocated ecosystem to the `qodinger` GitHub Organization for enhanced trust and scalability.
- **Blockchain Redundancy** — Implemented dual-provider support (Tatum + Alchemy) for EVM chains to ensure zero-downtime payment monitoring.
- **Failover Logic** — Built a resilient `ProviderPool` that automatically rotates between Tatum and Alchemy if a subscription fails.
- **Secure Webhooks** — Specialized Alchemy signature verification with automated test ping handling.

### Changed

- **Unified Branding** — Consolidated all packages under the `@knotengine/` scope (e.g., `@knotengine/sdk`, `@knotengine/types`).
- **Sidebar UX** — Reordered dashboard navigation to prioritize operations (Dashboard, Payments, Activity Log).
- **Notification Logic** — Refined signal-to-noise ratio by deduplicating alerts and adding `[TEST]` labels for dev clarity.
- **Improved Dev DX** — Replaced ngrok with `cloudflared` (Cloudflare Tunnel) for reliable, password-free local webhook testing.
- **Model Enhancements** — Updated `Invoice` schema to support provider-specific metadata and tracking.

## [0.2.1] - 2026-02-20

### Added

- **Automated Releases** — GitHub Actions workflow for automatic creation of GitHub Releases with changelog extraction.
- **SDK Automation** — Integrated GitHub Packages publishing for the `@tyecode/knotengine-sdk`.

### Changed

- **Branding & Scope** — Renamed official SDK to `@tyecode/knotengine-sdk` for compatibility with GitHub's package registry.
- **Version Syncing** — Updated `sync-versions` script to support both `@knotengine` and `@tyecode` scopes across the monorepo.

## [0.2.0] - 2026-02-18

### Added

- **SaaS Architecture** — Automated merchant onboarding via Tatum API for zero-touch blockchain monitoring.
- **Dynamic Checkout** — Next.js 16 consumer payment interface with cyberpunk aesthetic, QR codes, and live countdowns (Port 5051).
- **Merchant Console** — Scaffolded dashboard app for merchants to track volume and system health (Port 5052).
- **Socket.io Integration** — Instant real-time UI updates for payment detection and confirmation across the ecosystem.
- **Reliable Webhook Dispatcher** — Production-grade delivery engine with exponential backoff and persistent retry state.
- **Monetization Engine** — Built-in 0.5% "KnotEngine Fee" calculation and tracking on all invoices.
- **Port Isolation** — Standardized ecosystem to a unique port range (5050: API, 5051: Checkout, 5052: Dashboard).
- **Dynamic Versioning** — Ecosystem-wide logic to import version strings directly from individual `package.json` files.
- **Tooling** — Husky, lint-staged, Prettier, ESLint, and Commitlint for high-compliance dev workflows.
- **Monorepo scaffold** — Turborepo + pnpm workspaces with clean `apps/` and `packages/` separation.
- **@knotengine/crypto** — HD wallet derivation engine for BTC (P2WPKH) and EVM (ERC-20) monitoring.
- **@knotengine/database** — MongoDB persistence layer with Mongoose models for Merchant and Invoice lifecycle.
- **Price Oracle** — Real-time USD ↔ crypto conversion with 1-minute caching and stale fallbacks.
- **Verification Suite** — Finalized system-wide testing workflow including @knotengine/sdk unit tests and manual simulation endpoints.

### Changed

- **API Engine** — Improved error handling and performance optimizations for the core Knot server.
- **Webhooks** — Enhanced payload security with HMAC signatures and unique event IDs (`evt_...`).

[Unreleased]: https://github.com/qodinger/knotengine/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/qodinger/knotengine/releases/tag/v0.2.1
[0.2.0]: https://github.com/qodinger/knotengine/releases/tag/v0.2.0
