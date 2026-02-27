"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, swrKeys } from "@/lib/swr";
import { DashboardStats, Invoice, OverviewPeriod } from "../types";

type StatsResponse = DashboardStats;

interface InvoicesResponse {
  data: Invoice[];
}

export function useDashboard() {
  const [period, setPeriod] = useState<OverviewPeriod>("7d");

  const {
    data: statsData,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<StatsResponse>(swrKeys.merchantStats({ period }), fetcher, {
    revalidateOnFocus: false,
  });

  const { data: invoicesData, isLoading: invoicesLoading } =
    useSWR<InvoicesResponse>(swrKeys.invoices({ limit: "5" }), fetcher, {
      revalidateOnFocus: false,
    });

  const loading = statsLoading || invoicesLoading;
  const data = statsData ?? null;
  const recentInvoices = invoicesData?.data ?? [];

  return {
    data,
    recentInvoices,
    loading,
    period,
    setPeriod,
    fetchData: mutateStats,
  };
}
