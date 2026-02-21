"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { TestnetInvoice, MerchantConfig } from "../types";

export function useTestnet() {
  const [invoices, setInvoices] = useState<TestnetInvoice[]>([]);
  const [testnetLoading, setTestnetLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [config, setConfig] = useState<MerchantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTestnetData = useCallback(async () => {
    try {
      setTestnetLoading(true);
      const [configRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/invoices?limit=10&include_testnet=true"),
      ]);
      setConfig(configRes.data);
      const active = (invoicesRes.data.data as TestnetInvoice[]).filter((inv) =>
        ["pending", "mempool_detected", "confirming"].includes(inv.status),
      );
      setInvoices(active);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setTestnetLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestnetData();
  }, [fetchTestnetData]);

  const fetchPendingInvoices = async () => {
    try {
      const res = await api.get("/v1/invoices?limit=10&include_testnet=true");
      const active = (res.data.data as TestnetInvoice[]).filter((inv) =>
        ["pending", "mempool_detected", "confirming"].includes(inv.status),
      );
      setInvoices(active);
    } catch (err) {
      console.error("Failed to fetch active invoices", err);
    }
  };

  const simulatePayment = async (invoice: TestnetInvoice) => {
    setSimulating(invoice.invoice_id);
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    const setInvoiceStatus = (status: string) => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoice_id === invoice.invoice_id ? { ...inv, status } : inv,
        ),
      );
    };

    try {
      setInvoiceStatus("mempool_detected");
      await api.post("/v1/webhooks/simulate", {
        invoiceId: invoice.invoice_id,
        txHash,
        amount: invoice.crypto_amount.toString(),
        asset: invoice.crypto_currency,
        confirmations: 0,
      });

      setTimeout(async () => {
        setInvoiceStatus("confirming");
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 1,
        });
      }, 2000);

      setTimeout(async () => {
        setInvoiceStatus("confirmed");
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 12,
        });
        setSuccessId(invoice.invoice_id);
        setSimulating(null);
        setTimeout(() => {
          setSuccessId(null);
          fetchPendingInvoices();
        }, 3000);
      }, 5000);
    } catch (err) {
      console.error("Simulation failed", err);
      setSimulating(null);
    }
  };

  const createTestInvoice = async () => {
    if (!config) return;
    try {
      setTestnetLoading(true);
      setError(null);
      const availableCurrencies: string[] = [];
      if (config.btcXpub || config.btcXpubTestnet) {
        availableCurrencies.push("BTC");
      }
      if (config.ethAddress || config.ethAddressTestnet) {
        availableCurrencies.push("ETH");
      }

      if (availableCurrencies.length === 0) {
        setError(
          "Wallet configuration missing. Add a BTC xPub or ETH Address in Settings or generate Testnet Wallets here.",
        );
        return;
      }

      const currency =
        availableCurrencies[
          Math.floor(Math.random() * availableCurrencies.length)
        ];
      await api.post("/v1/invoices", {
        amount_usd: Math.round((10 + Math.random() * 90) * 100) / 100,
        currency,
        is_testnet: true,
      });
      await fetchPendingInvoices();
    } catch (err) {
      console.error("Failed to create test invoice", err);
    } finally {
      setTestnetLoading(false);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  return {
    invoices,
    testnetLoading,
    simulating,
    successId,
    config,
    error,
    copied,
    simulatePayment,
    createTestInvoice,
    fetchPendingInvoices,
    copyToClipboard,
  };
}
