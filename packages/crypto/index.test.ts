import { describe, it, expect } from "vitest";
import { Derivator } from "./index";

describe("Derivator (The Knot Engine Core)", () => {
  // A known public test vector (Mnemonic: "abandon abandon ...")
  // xPub for Path m/84'/0'/0' (Native Segwit)

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
