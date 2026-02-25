"use client";

import { Download, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface PaymentsHeaderProps {
  activeTab: string;
  plan?: "starter" | "professional" | "enterprise";
  onExport?: () => void;
  isExporting?: boolean;
  invoiceCount?: number;
}

export function PaymentsHeader({
  activeTab,
  plan,
  onExport,
  isExporting,
  invoiceCount = 0,
}: PaymentsHeaderProps) {
  const isPro = plan === "professional" || plan === "enterprise";

  return (
    <div className="flex items-start justify-between gap-4">
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

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {isPro ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isExporting || invoiceCount === 0}
                className="gap-2 text-xs"
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Export CSV
              </Button>
            ) : (
              <Link href="/dashboard/billing" prefetch={false}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-amber-500/20 text-xs text-amber-500/80 hover:border-amber-500/40 hover:text-amber-500"
                >
                  <Lock className="size-3.5" />
                  Export CSV
                </Button>
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs text-center text-xs">
            {isPro
              ? invoiceCount === 0
                ? "No invoices to export."
                : `Export ${invoiceCount} invoice${invoiceCount !== 1 ? "s" : ""} as CSV.`
              : "Upgrade to Professional or Enterprise to export transaction history."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
