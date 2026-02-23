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
        [
          "pending",
          "mempool_detected",
          "confirming",
          "partially_paid",
        ].includes(inv.status),
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
        [
          "pending",
          "mempool_detected",
          "confirming",
          "partially_paid",
        ].includes(inv.status),
      );
      setInvoices(active);
    } catch (err) {
      console.error("Failed to fetch active invoices", err);
    }
  };

  const simulatePayment = async (
    invoice: TestnetInvoice,
    overrideAmount?: string,
  ) => {
    setSimulating(invoice.invoice_id);
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    const setInvoiceStatus = (status: string) => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoice_id === invoice.invoice_id ? { ...inv, status } : inv,
        ),
      );
    };

    const finalAmount = overrideAmount || invoice.crypto_amount.toString();

    try {
      const res0 = await api.post("/v1/webhooks/simulate", {
        invoiceId: invoice.invoice_id,
        txHash,
        amount: finalAmount,
        asset: invoice.crypto_currency,
        confirmations: 0,
      });
      if (res0.data?.newStatus) setInvoiceStatus(res0.data.newStatus);

      setTimeout(async () => {
        const res1 = await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: finalAmount,
          asset: invoice.crypto_currency,
          confirmations: 1,
        });
        if (res1.data?.newStatus) setInvoiceStatus(res1.data.newStatus);
      }, 2000);

      setTimeout(async () => {
        const res12 = await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: finalAmount,
          asset: invoice.crypto_currency,
          confirmations: 12,
        });

        const finalStatus = res12.data?.newStatus || "confirmed";
        setInvoiceStatus(finalStatus);

        if (["confirmed", "overpaid", "expired"].includes(finalStatus)) {
          setSuccessId(invoice.invoice_id);
        }

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

  const createTestInvoice = async (amount: number, currency: string) => {
    if (!config) return false;
    try {
      setTestnetLoading(true);
      setError(null);
      await api.post("/v1/invoices", {
        amount_usd: amount,
        currency,
        is_testnet: true,
      });
      await fetchPendingInvoices();
      return true;
    } catch (err: unknown) {
      console.error("Failed to create test invoice", err);
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to create invoice",
      );
      return false;
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
