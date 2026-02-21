"use client";

import { Suspense } from "react";
import { usePayments } from "./hooks/use-payments";
import { PaymentsHeader } from "./components/payments-header";
import { PaymentsStats } from "./components/payments-stats";
import { PaymentsTable } from "./components/payments-table";
import { InvoiceDetailsSheet } from "./components/invoice-details-sheet";

function PaymentsContent() {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    copiedId,
    selectedInvoice,
    setSelectedInvoice,
    timeline,
    loadingTimeline,
    copyToClipboard,
    openInvoiceDetails,
    filteredInvoices,
    stats,
  } = usePayments();

  return (
    <div className="flex flex-col gap-6">
      <PaymentsHeader activeTab={activeTab} />

      <PaymentsStats
        activeTab={activeTab}
        invoicesCount={stats.totalCount}
        confirmedCount={stats.confirmedCount}
        pendingCount={stats.pendingCount}
        totalVolume={stats.totalVolume}
        loading={loading}
      />

      <PaymentsTable
        invoices={filteredInvoices}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        copiedId={copiedId}
        copyToClipboard={copyToClipboard}
        openInvoiceDetails={openInvoiceDetails}
      />

      <InvoiceDetailsSheet
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        timeline={timeline}
        loadingTimeline={loadingTimeline}
        copiedId={copiedId}
        copyToClipboard={copyToClipboard}
      />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
