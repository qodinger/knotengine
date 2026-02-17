import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory, BIP32Interface } from "bip32";
import { ethers } from "ethers";
import * as crypto from "crypto";

const bip32 = BIP32Factory(ecc);

export class Derivator {
  /**
   * Derives a Bitcoin (SegWit P2WPKH) address from an xPub and index.
   * Standard: BIP44/BIP84 style derivation for external addresses.
   */
  public static deriveBitcoinAddress(
    xpub: string,
    index: number,
    networkName: "bitcoin" | "testnet" | "regtest" = "bitcoin",
  ): string {
    const network =
      bitcoin.networks[networkName as keyof typeof bitcoin.networks] ||
      bitcoin.networks.bitcoin;
    const node: BIP32Interface = bip32.fromBase58(xpub, network);
    const child = node.derive(0).derive(index);

    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network,
    });

    if (!address) throw new Error("Failed to derive BTC address");
    return address;
  }

  /**
   * Derives an Ethereum/EVM address from an xPub and index.
   * Note: For EVM, usually merchants use a single address, but BIP44 derivation
   * allows for one-address-per-order privacy.
   */
  public static deriveEthereumAddress(xpub: string, index: number): string {
    const node: BIP32Interface = bip32.fromBase58(xpub);
    const child = node.derive(0).derive(index);

    // Convert public key to Ethereum address
    // We use ethers.computeAddress which handles the public key to address conversion
    const publicKey = child.publicKey.toString("hex");
    return ethers.computeAddress("0x" + publicKey);
  }

  /**
   * Signs a payload with a secret key using HMAC-SHA256.
   * Used for secure Webhook notifications.
   */
  public static signWebhookPayload(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Verifies a webhook signature.
   */
  public static verifyWebhookSignature(
    signature: string,
    payload: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.signWebhookPayload(payload, secret);
    const source = Buffer.from(signature, "hex");
    const target = Buffer.from(expectedSignature, "hex");

    if (source.length !== target.length) {
      return false;
    }

    return crypto.timingSafeEqual(source, target);
  }
}
