# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Two-Factor Authentication (2FA)** — Implemented complete TOTP-based security flow with backup codes and middleware enforcement.
- **Professional Merchant IDs** — Introduced `mid_` prefixed identity system with unique generation retry logic for enhanced API professionalism.
- **Blockchain Redundancy** — Implemented dual-provider support (Tatum + Alchemy) for EVM chains to ensure zero-downtime payment monitoring.
- **Failover Logic** — Built a resilient `ProviderPool` that automatically rotates between Tatum and Alchemy if a subscription fails.
- **Secure Webhooks** — Specialized Alchemy signature verification with automated test ping handling.
- **Automatic Cleanup** — Implemented 30-day Retention (TTL) Policy for `WebhookEvent` and `Notification` collections to prevent database bloat.
- **Dashboard Real-time Alerts** — Production-ready toasts for payments, expirations, and webhook failures via Socket.io.
- **Deduplication Indexing** — Implemented compound database indexing on `Notification` models to maintain high-performance lookups as history grows.
- **Manual Event Metadata** — Enhanced manual resolution logs with consistent metadata linking for better traceability.
- **Organization Migration** — Relocated ecosystem to the `qodinger` GitHub Organization for enhanced trust and scalability.

### Fixed

- **Notification Duplication** — Fixed a bug where special regex characters in titles (like `[TEST]`) caused duplicate alert entries.
- **Testnet Visibility** — Resolved inconsistent filtering on the Payments page to correctly show or hide testnet invoices based on active tabs.
- **Type Safety** — Corrected multiple TypeScript compilation and lint errors across the API and Dashboard monorepo.
- **Broken Imports** — Fixed missing asset config imports in the Billing and Balances pages.

### Removed

- **Legacy Dashboard Pages** — Cleaned up unused and deprecated directory structures in the Dashboard application to reduce bundle size.
- **Hardcoded Configurations** — Removed all hardcoded asset and network references, transitioning fully to dynamic shared types.

### Changed

- **Settings Architecture** — Relocated technical Merchant IDs to the Developers tab and simplified business settings.
- **Unified Branding** — Consolidated all packages under the `qodinger` scope (e.g., `@qodinger/knot-database`, `@qodinger/knot-types`).
- **Sidebar UX** — Reordered dashboard navigation to prioritize operations (Dashboard, Payments, Activity Log).
- **Modular Dashboard Architecture** — Completely refactored Balances, Billing, Payments, and Settings into a modern, hook-centric component system for better maintainability.
- **Regex-Safe Notifications** — Hardened the deduplication engine with regex escaping to support special characters and labels in log titles.
- **Unified Testnet Experience** — Synchronized `[TEST]` branding across real-time toasts, activity history, and terminal logs for all payment types.
- **Asset-Agnostic Simulations** — Enabled testnet support for all system-configured currencies, removing hardcoded testnet-only restrictions.
- **Notification Logic** — Refined signal-to-noise ratio by deduplicating alerts and optimizing event grouping.
- **Improved Dev DX** — Replaced ngrok with `cloudflared` (Cloudflare Tunnel) for reliable local webhook testing.
- **Reset Utility** — Added a safe database reset script for development with environment guards.

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
