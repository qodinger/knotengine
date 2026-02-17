import * as crypto from "crypto";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";

const bip32 = BIP32Factory(ecc);
const network = bitcoin.networks.testnet;

console.log("Generating valid Bitcoin Testnet Address...");

// Random 32 bytes for entropy/seed
const seed = crypto.randomBytes(32);
const root = bip32.fromSeed(seed, network);

// Derive a standard path for testnet (m/84'/1'/0'/0/0)
const child = root.derivePath("m/84'/1'/0'/0/0");

// Get Native Segwit Address (starts with tb1)
const { address } = bitcoin.payments.p2wpkh({
  pubkey: child.publicKey,
  network,
});

console.log(`
============================================================
VALID BITCOIN TESTNET ADDRESS
------------------------------------------------------------
${address}
------------------------------------------------------------
Use this address in the Tatum dashboard subscription setup.
============================================================
`);
