"use client";

import { Suspense } from "react";
import { usePayments } from "./hooks/use-payments";
import { useExportCsv } from "./hooks/use-export-csv";
import { PaymentsHeader } from "./components/payments-header";
import { PaymentsStats } from "./components/payments-stats";
import { PaymentsTable } from "./components/payments-table";
import { InvoiceDetailsSheet } from "./components/invoice-details-sheet";

function PaymentsContent() {
  const {
    loading,
    plan,
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
    handleResolve,
  } = usePayments();

  const { exportCsv, isExporting } = useExportCsv();

  const handleExport = () => {
    exportCsv(filteredInvoices, plan);
  };

  return (
    <div className="flex flex-col gap-6">
      <PaymentsHeader
        activeTab={activeTab}
        plan={plan}
        onExport={handleExport}
        isExporting={isExporting}
        invoiceCount={filteredInvoices.length}
      />

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
        onResolve={handleResolve}
      />

      <InvoiceDetailsSheet
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        timeline={timeline}
        loadingTimeline={loadingTimeline}
        copiedId={copiedId}
        copyToClipboard={copyToClipboard}
        onResolve={handleResolve}
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
