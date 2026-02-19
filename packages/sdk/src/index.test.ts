import { describe, it, expect, vi } from "vitest";
import { KnotEngine } from "./index";
import * as crypto from "crypto";

vi.mock("axios");

describe("KnotEngine SDK", () => {
  const config = {
    apiKey: "knot_test_123",
    webhookSecret: "whsec_test_123",
  };

  it("should initialize with correct config", () => {
    const sdk = new KnotEngine(config);
    expect(sdk).toBeDefined();
  });

  it("should verify a valid webhook signature", () => {
    const sdk = new KnotEngine(config);
    const payload = JSON.stringify({ event: "invoice.confirmed" });

    // Calculate expected signature manually to verify SDK logic
    const hmac = crypto.createHmac("sha256", config.webhookSecret);
    hmac.update(payload);
    const signature = hmac.digest("hex");

    const isValid = sdk.verifyWebhook(payload, signature);
    expect(isValid).toBe(true);
  });

  it("should reject an invalid webhook signature", () => {
    const sdk = new KnotEngine(config);
    const payload = JSON.stringify({ event: "invoice.confirmed" });
    const isValid = sdk.verifyWebhook(payload, "invalid_signature");
    expect(isValid).toBe(false);
  });

  it("should throw error if webhookSecret is missing during verification", () => {
    const sdk = new KnotEngine({ apiKey: "test" });
    expect(() => sdk.verifyWebhook("{}", "sig")).toThrow(
      "Webhook secret not configured in SDK.",
    );
  });
});
