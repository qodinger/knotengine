"use client";

import { useDashboard } from "./overview/hooks/use-dashboard";
import { OverviewHeader } from "./overview/components/overview-header";
import { OverviewStats } from "./overview/components/overview-stats";
import { VolumeChart } from "./overview/components/volume-chart";
import { RecentInvoices } from "./overview/components/recent-invoices";
import { FeaturedPartner } from "./overview/components/featured-partner";
import { AnalyticsSection } from "./overview/components/analytics-section";

export default function DashboardOverview() {
  const { data, recentInvoices, loading, period, setPeriod, mounted } =
    useDashboard();

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6">
      <OverviewHeader />

      <OverviewStats data={data} loading={loading} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <VolumeChart data={data} period={period} setPeriod={setPeriod} />
        <RecentInvoices invoices={recentInvoices} />
      </div>

      <AnalyticsSection data={data} loading={loading} />

      <FeaturedPartner />
    </div>
  );
}
