"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Invoice, TimelineEvent } from "../types";

export function usePayments() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(tabParam || "all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (activeTab === "testnet") {
        params.include_testnet = "true";
        params.only_testnet = "true";
      }
      const res = await api.get("/v1/invoices", { params });
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `?tab=${tab}`);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchTimeline = async (invoiceId: string) => {
    setLoadingTimeline(true);
    try {
      const res = await api.get("/v1/merchants/me/notifications", {
        params: { invoiceId, limit: 50 },
      });
      setTimeline(res.data.data);
    } catch (err) {
      console.error("Failed to fetch timeline", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    fetchTimeline(invoice.invoice_id);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.crypto_currency.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "all" || activeTab === "testnet") return true;

      if (activeTab === "confirmed") {
        return ["confirmed", "overpaid"].includes(inv.status);
      }

      if (activeTab === "pending") {
        return [
          "pending",
          "partially_paid",
          "confirming",
          "mempool_detected",
        ].includes(inv.status);
      }

      return inv.status === activeTab;
    });
  }, [invoices, searchTerm, activeTab]);

  const stats = useMemo(() => {
    const totalVolume = invoices
      .filter((inv) => ["confirmed", "overpaid"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount_usd, 0);
    const confirmedCount = invoices.filter((inv) =>
      ["confirmed", "overpaid"].includes(inv.status),
    ).length;
    const pendingCount = invoices.filter((inv) =>
      ["pending", "partially_paid", "confirming", "mempool_detected"].includes(
        inv.status,
      ),
    ).length;

    return {
      totalVolume,
      confirmedCount,
      pendingCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  const handleResolve = async (invoiceId: string) => {
    try {
      await api.post(`/v1/invoices/${invoiceId}/resolve`);
      await fetchInvoices();
    } catch (err) {
      console.error("Failed to resolve invoice", err);
    }
  };

  return {
    invoices,
    loading,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab: handleTabChange,
    copiedId,
    selectedInvoice,
    setSelectedInvoice,
    timeline,
    loadingTimeline,
    copyToClipboard,
    openInvoiceDetails,
    filteredInvoices,
    stats,
    fetchInvoices,
    handleResolve,
  };
}
