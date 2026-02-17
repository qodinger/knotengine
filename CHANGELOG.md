# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-17

### Added

- **Tooling** — Set up Husky, lint-staged, Prettier, ESLint, and Commitlint for code quality and conventional commits enforcement.
- **Monorepo scaffold** — Turborepo + pnpm workspaces with `apps/` and `packages/` structure.
- **@tyepay/crypto** — HD wallet derivation engine (`bip32`, `bitcoinjs-lib`) for BTC (P2WPKH) and EVM (`ethers.js`) address generation, plus HMAC-SHA256 webhook signing/verification.
- **@tyepay/database** — MongoDB persistence layer with Mongoose models for `Merchant` and `Invoice`.
- **@tyepay/types** — Shared TypeScript type definitions (`Currency`, `InvoiceStatus`, `Merchant`, `Invoice`).
- **API server** — Fastify with Zod validation, CORS, merchant registration endpoint (`POST /v1/merchants`).
- **Price Oracle** — Real-time USD ↔ crypto conversion via CoinGecko API with 1-minute cache and stale fallback.
- **x402 scaffold** — `GET /v1/agent/test` returning HTTP 402 with `WWW-Authenticate` header for agentic payment handshakes.
- **Test suite** — Vitest tests for crypto package (4/4 passing): BTC derivation, idempotency, EVM derivation, webhook signing.

[Unreleased]: https://github.com/tyecode/tyepay/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tyecode/tyepay/releases/tag/v0.1.0
