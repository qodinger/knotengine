"use client";

interface PaymentsHeaderProps {
  activeTab: string;
}

export function PaymentsHeader({ activeTab }: PaymentsHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {activeTab === "testnet" ? "Test Payments" : "Payments"}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {activeTab === "testnet"
          ? "View and manage all simulated testnet transactions."
          : "View and manage all incoming payment invoices."}
      </p>
    </div>
  );
}
