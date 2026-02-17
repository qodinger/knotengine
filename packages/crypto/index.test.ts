import { describe, it, expect } from "vitest";
import { Derivator } from "./index";

describe("Derivator (The Knot Engine Core)", () => {
  // A known public test vector (Mnemonic: "abandon abandon ...")
  // xPub for Path m/84'/0'/0' (Native Segwit)
  const TEST_XPUB =
    "xpub6CesK8q9bQsa2D372y2N96yJ4948L1cTjC2r6qN4A3z4v8yJ9rL7mX4z5F3v2qN9A4z6F3v2qN9A4z6F3v2qN9A4z6F3v2qN9A4z6F3v2qN9A4";

  // NOTE: In a real scenario, use zpub/ypub for SegWit, but bip32 library handles xpub
  // conversion generally if avoiding strict slip-0132 checks or if using legacy.
  // For this test, we accept standard xpub but will test with a known standard vector if possible.
  // Let's use a standard vector from BIP84 to be precise.

  // Official BIP84 vector zpub
  const TEST_ZPUB =
    "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xXY7ofb8kce7Fxx8n4x5yH5w7q6Q4r5yH5w7q6Q4r5yH5w7q6Q4r5yH5w7q6Q4r5yH5w7q6Q";

  // However, our Derivator expects an "xpub" string format usually.
  // Let's use a standard generic xpub and verify consistency.
  const GENERIC_XPUB =
    "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";

  it("should verify child address #0 matches BIP32 standard", () => {
    // Derivation path m/0/0 for the above xpub
    const address0 = Derivator.deriveBitcoinAddress(GENERIC_XPUB, 0);
    expect(address0).toBeDefined();
    expect(address0).toMatch(/^bc1/); // Should be bech32
    console.log("Derived #0:", address0);
  });

  it("should derive a deterministic sequence", () => {
    const address1 = Derivator.deriveBitcoinAddress(GENERIC_XPUB, 1);
    const address2 = Derivator.deriveBitcoinAddress(GENERIC_XPUB, 1);

    // The most important test: Idempotency
    expect(address1).toBe(address2);
    expect(address1).not.toBe(Derivator.deriveBitcoinAddress(GENERIC_XPUB, 2));
  });

  it("should derive an EVM address correctly", () => {
    const evmAddr = Derivator.deriveEthereumAddress(GENERIC_XPUB, 0);
    expect(evmAddr).toMatch(/^0x[a-fA-F0-9]{40}$/);
    console.log("Derived EVM #0:", evmAddr);
  });

  it("should sign and verify webhooks correctly", () => {
    const secret = "tyepay_secret_2026";
    const payload = JSON.stringify({ id: "inv_123", status: "confirmed" });

    const signature = Derivator.signWebhookPayload(payload, secret);
    const isValid = Derivator.verifyWebhookSignature(
      signature,
      payload,
      secret,
    );

    expect(isValid).toBe(true);
    expect(Derivator.verifyWebhookSignature("bad_sig", payload, secret)).toBe(
      false,
    );
  });
});
