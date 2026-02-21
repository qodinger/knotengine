"use client";

import { format } from "date-fns";
import { Copy, Check, Clock, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Invoice, TimelineEvent } from "../types";
import { StatusBadge } from "./status-badge";

interface InvoiceDetailsSheetProps {
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  timeline: TimelineEvent[];
  loadingTimeline: boolean;
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

export function InvoiceDetailsSheet({
  selectedInvoice,
  setSelectedInvoice,
  timeline,
  loadingTimeline,
  copiedId,
  copyToClipboard,
}: InvoiceDetailsSheetProps) {
  return (
    <Sheet
      open={!!selectedInvoice}
      onOpenChange={(open) => !open && setSelectedInvoice(null)}
    >
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              Invoice Details
            </Badge>
            {selectedInvoice?.metadata?.isTestnet && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">
                TESTNET
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl font-bold font-mono">
            {selectedInvoice?.invoice_id}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Created on{" "}
            {selectedInvoice &&
              format(new Date(selectedInvoice.created_at), "PPP 'at' HH:mm")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
                Status
              </p>
              <StatusBadge status={selectedInvoice?.status || "pending"} />
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
                Total Amount
              </p>
              <p className="text-lg font-bold">
                ${selectedInvoice?.amount_usd.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Payment Info
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm p-3 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-bold">
                  {selectedInvoice?.crypto_currency}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Crypto Amount</span>
                <span className="font-mono">
                  {selectedInvoice?.crypto_amount}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground">
                  Destination Address
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono break-all text-foreground/80">
                    {selectedInvoice?.pay_address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedInvoice)
                        copyToClipboard(
                          selectedInvoice.pay_address,
                          "side-addr",
                        );
                    }}
                  >
                    {copiedId === "side-addr" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Activity History
            </h3>

            <div className="relative pl-4 border-l border-border/50 ml-2 space-y-6 pb-2">
              {loadingTimeline ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-muted border-2 border-background" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))
              ) : (
                <>
                  {timeline.map((event, idx) => (
                    <div key={event._id || idx} className="relative">
                      <div
                        className={cn(
                          "absolute -left-[21px] top-1 size-3 rounded-full border-2 border-background",
                          event.type === "success"
                            ? "bg-emerald-500"
                            : event.type === "error"
                              ? "bg-rose-500"
                              : event.type === "warning"
                                ? "bg-amber-500"
                                : "bg-primary",
                        )}
                      />
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold">{event.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.createdAt), "HH:mm:ss")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  ))}

                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-muted-foreground/30 border-2 border-background" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold">Invoice Created</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {selectedInvoice &&
                          format(
                            new Date(selectedInvoice.created_at),
                            "HH:mm:ss",
                          )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      System generated invoice for $
                      {selectedInvoice?.amount_usd.toFixed(2)} USD.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedInvoice?.tx_hash && (
            <Button
              asChild
              className="w-full gap-2 h-10 font-bold uppercase tracking-wider text-[11px]"
              variant="secondary"
            >
              <a
                href={
                  selectedInvoice.crypto_currency === "BTC"
                    ? `https://mempool.space/tx/${selectedInvoice.tx_hash}`
                    : `https://etherscan.io/tx/${selectedInvoice.tx_hash}`
                }
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3" />
                View on Blockchain
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
