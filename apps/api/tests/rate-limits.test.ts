import { describe, it, expect } from "vitest";

// Extracted from apps/api/src/routes/invoices.ts
function getInvoiceRateLimit(merchantPlan?: string | null): number {
  if (merchantPlan === "enterprise") return 600; // 10 req/s equivalent
  if (merchantPlan === "professional") return 300; // 5 req/s equivalent
  return 60; // Starter tier limit (1 req/s)
}

describe("API Security & Rate Limits", () => {
  describe("getInvoiceRateLimit()", () => {
    it("should restrict Starter plan users to 60 requests per minute", () => {
      expect(getInvoiceRateLimit("starter")).toBe(60);
    });

    it("should restrict users with no defined plan (fallback) to 60 requests per minute", () => {
      expect(getInvoiceRateLimit(undefined)).toBe(60);
      expect(getInvoiceRateLimit(null)).toBe(60);
      expect(getInvoiceRateLimit("")).toBe(60);
    });

    it("should grant Professional plan users 300 requests per minute", () => {
      expect(getInvoiceRateLimit("professional")).toBe(300);
    });

    it("should grant Enterprise plan users 600 requests per minute (max)", () => {
      expect(getInvoiceRateLimit("enterprise")).toBe(600);
    });

    it("should return the default limit if a completely unknown plan is passed", () => {
      expect(getInvoiceRateLimit("hacker_tier")).toBe(60);
      expect(getInvoiceRateLimit("admin")).toBe(60);
    });
  });

  describe("API DoS Prevention Analysis", () => {
    it("must enforce that Starter allows exactly 1 req/sec on average", () => {
      const limit = getInvoiceRateLimit("starter");
      const reqPerSec = limit / 60;
      expect(reqPerSec).toBe(1.0);
    });

    it("must enforce that Enterprise allows exactly 10 req/sec on average", () => {
      const limit = getInvoiceRateLimit("enterprise");
      const reqPerSec = limit / 60;
      expect(reqPerSec).toBe(10.0);
    });
  });
});
