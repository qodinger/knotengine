"use client";

import { useState, useCallback } from "react";
import { Invoice } from "../types";

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(invoices: Invoice[]): string {
  const headers = [
    "Invoice ID",
    "Status",
    "Amount (USD)",
    "Crypto Amount",
    "Currency",
    "Pay Address",
    "TX Hash",
    "Confirmations",
    "Created At",
    "Paid At",
    "Expires At",
    "Network",
  ];

  const rows = invoices.map((inv) => [
    escapeCell(inv.invoice_id),
    escapeCell(inv.status),
    escapeCell(inv.amount_usd.toFixed(2)),
    escapeCell(inv.crypto_amount),
    escapeCell(inv.crypto_currency),
    escapeCell(inv.pay_address),
    escapeCell(inv.tx_hash),
    escapeCell(inv.confirmations),
    escapeCell(new Date(inv.created_at).toISOString()),
    escapeCell(inv.paid_at ? new Date(inv.paid_at).toISOString() : ""),
    escapeCell(new Date(inv.expires_at).toISOString()),
    escapeCell(inv.metadata?.isTestnet ? "testnet" : "mainnet"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function useExportCsv() {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = useCallback(
    (
      invoices: Invoice[],
      plan: "starter" | "professional" | "enterprise" | undefined,
    ) => {
      if (plan === "starter" || !plan) {
        // Caller should handle the gate UI, but silently return
        return;
      }

      setIsExporting(true);
      try {
        const csv = buildCsv(invoices);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);

        const link = document.createElement("a");
        link.href = url;
        link.download = `knotengine-payments-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportCsv, isExporting };
}
