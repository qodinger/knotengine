import { describe, it, expect } from "vitest";
import { Derivator } from "@qodinger/knot-crypto";
import * as crypto from "crypto";

describe("Webhook Signatures & Security", () => {
  const MOCK_SECRET = "whsec_test_1234567890abcdef";
  const MOCK_PAYLOAD = JSON.stringify({
    id: "evt_test_123",
    event: "invoice.confirmed",
    invoice_id: "inv_123",
    amount: { usd: 100 },
  });

  it("should generate a consistent signature for the same payload and secret", () => {
    const signature1 = Derivator.signWebhookPayload(MOCK_PAYLOAD, MOCK_SECRET);
    const signature2 = Derivator.signWebhookPayload(MOCK_PAYLOAD, MOCK_SECRET);

    expect(signature1).toBe(signature2);
    expect(typeof signature1).toBe("string");
  });

  it("should generate different signatures for different secrets", () => {
    const signature1 = Derivator.signWebhookPayload(MOCK_PAYLOAD, MOCK_SECRET);
    const signature2 = Derivator.signWebhookPayload(
      MOCK_PAYLOAD,
      "different_secret",
    );

    expect(signature1).not.toBe(signature2);
  });

  it("should generate different signatures for tampered payloads", () => {
    const signature1 = Derivator.signWebhookPayload(MOCK_PAYLOAD, MOCK_SECRET);

    // Hacker attempts to change the USD amount to $0
    const tamperedPayload = JSON.stringify({
      id: "evt_test_123",
      event: "invoice.confirmed",
      invoice_id: "inv_123",
      amount: { usd: 0 },
    });

    const signature2 = Derivator.signWebhookPayload(
      tamperedPayload,
      MOCK_SECRET,
    );

    expect(signature1).not.toBe(signature2);
  });

  it("should correctly verify using standard HMAC SHA-256 validation", () => {
    const generatedSignature = Derivator.signWebhookPayload(
      MOCK_PAYLOAD,
      MOCK_SECRET,
    );

    // Manually calculate HMAC to verify Derivator isn't doing something non-standard
    const expectedHmac = crypto
      .createHmac("sha256", MOCK_SECRET)
      .update(MOCK_PAYLOAD)
      .digest("hex");

    // The signature might be prefixed with "v1=" or it might just be the raw hex.
    // Let's check if it includes the expected HMAC.
    expect(generatedSignature).toContain(expectedHmac);
  });
});
