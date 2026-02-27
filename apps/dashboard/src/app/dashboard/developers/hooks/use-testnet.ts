"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { fetcher, swrKeys } from "@/lib/swr";
import { TestnetInvoice, MerchantConfig } from "../types";

interface InvoicesResponse {
  data: TestnetInvoice[];
}

export function useTestnet() {
  const [simulating, setSimulating] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: config } = useSWR<MerchantConfig>(swrKeys.merchant, fetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: invoicesData,
    isLoading: testnetLoading,
    mutate: mutateInvoices,
  } = useSWR<InvoicesResponse>(
    ["/v1/invoices", { limit: "10", include_testnet: "true" }],
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  // Filter to only active invoices
  const invoices = (invoicesData?.data ?? []).filter((inv) =>
    ["pending", "mempool_detected", "confirming", "partially_paid"].includes(
      inv.status,
    ),
  );

  // Local state for invoice status updates during simulation
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, string>
  >({});

  const displayInvoices = invoices.map((inv) =>
    statusOverrides[inv.invoice_id]
      ? { ...inv, status: statusOverrides[inv.invoice_id] }
      : inv,
  );

  const fetchPendingInvoices = async () => {
    setStatusOverrides({});
    await mutateInvoices();
  };

  const simulatePayment = async (
    invoice: TestnetInvoice,
    overrideAmount?: string,
  ) => {
    setSimulating(invoice.invoice_id);
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    const setInvoiceStatus = (status: string) => {
      setStatusOverrides((prev) => ({
        ...prev,
        [invoice.invoice_id]: status,
      }));
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
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  return {
    invoices: displayInvoices,
    testnetLoading,
    simulating,
    successId,
    config: config ?? null,
    error,
    copied,
    simulatePayment,
    createTestInvoice,
    fetchPendingInvoices,
    copyToClipboard,
  };
}
