"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { DashboardStats, Invoice, OverviewPeriod } from "../types";

export function useDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<OverviewPeriod>("7d");
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me/stats", { params: { period } }),
        api.get("/v1/invoices", { params: { limit: 5 } }),
      ]);
      setData(statsRes.data);
      setRecentInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    recentInvoices,
    loading,
    period,
    setPeriod,
    mounted,
    fetchData,
  };
}
