"use client";

import { useState } from "react";

import {
  Search,
  MoreHorizontal,
  Copy,
  Check,
  Calendar,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Invoice } from "../types";
import { StatusBadge } from "./status-badge";

interface PaymentsTableProps {
  invoices: Invoice[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
  openInvoiceDetails: (invoice: Invoice) => void;
  onResolve: (invoiceId: string) => void;
}

export function PaymentsTable({
  invoices,
  loading,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  copiedId,
  copyToClipboard,
  openInvoiceDetails,
  onResolve,
}: PaymentsTableProps) {
  const [confirmResolveId, setConfirmResolveId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full lg:w-auto"
        >
          <TabsList className="bg-muted/30 h-9">
            <TabsTrigger value="all" className="px-3 text-xs font-medium">
              All
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="px-3 text-xs font-medium">
              Succeeded
            </TabsTrigger>
            <TabsTrigger value="pending" className="px-3 text-xs font-medium">
              Pending
            </TabsTrigger>
            <TabsTrigger value="expired" className="px-3 text-xs font-medium">
              Expired
            </TabsTrigger>
            <TabsTrigger
              value="testnet"
              className="gap-1.5 px-3 text-xs font-medium"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-yellow-500" />
              Testnet
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={14}
          />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-muted/30 h-9 border-none pl-9 text-sm"
          />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border py-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 h-12 hover:bg-transparent">
                <TableHead className="w-[220px] pl-6 text-[10px] font-bold tracking-wider uppercase">
                  Amount
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Invoice ID
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Currency
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Date
                </TableHead>
                <TableHead className="pr-6 text-right text-[10px] font-bold tracking-wider uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border/20 border-b">
                    <TableCell className="pl-6">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/30 flex size-12 items-center justify-center rounded-full">
                        <CreditCard className="text-muted-foreground/20 size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-semibold">
                          No payments found
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {searchTerm
                            ? "Try adjusting your search query."
                            : "Payments will appear here when invoices are created."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow
                    key={inv.invoice_id}
                    className="border-border/20 hover:bg-muted/5 group cursor-pointer border-b transition-colors"
                    onClick={() => openInvoiceDetails(inv)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          $
                          {inv.amount_usd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {inv.crypto_amount} {inv.crypto_currency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-mono text-xs">
                          {inv.invoice_id}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(inv.invoice_id, inv.invoice_id);
                          }}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {copiedId === inv.invoice_id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="text-muted-foreground hover:text-foreground size-3" />
                          )}
                        </button>
                        {inv.metadata?.isTestnet && (
                          <Badge
                            variant="outline"
                            className="h-4 border-yellow-500/20 bg-yellow-500/5 px-1 py-0 text-[9px] text-yellow-500"
                          >
                            TEST
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px] font-semibold tracking-wide"
                      >
                        {inv.crypto_currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {format(new Date(inv.created_at), "MMM d, HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInvoiceDetails(inv);
                            }}
                          >
                            <Info className="mr-2 h-3.5 w-3.5" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(inv.invoice_id, inv.invoice_id);
                            }}
                          >
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Copy invoice ID
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              const checkoutUrl =
                                process.env.NEXT_PUBLIC_CHECKOUT_URL ||
                                "https://checkout.knotengine.com";
                              window.open(
                                `${checkoutUrl}/checkout/${inv.invoice_id}`,
                                "_blank",
                              );
                            }}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Open checkout
                          </DropdownMenuItem>

                          {!["confirmed", "overpaid"].includes(inv.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs text-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-600 focus:bg-emerald-500/5 focus:text-emerald-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmResolveId(inv.invoice_id);
                                }}
                              >
                                <Check className="mr-2 h-3.5 w-3.5" />
                                Resolve payment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {invoices.length > 0 && (
          <CardFooter className="bg-muted/5 flex items-center justify-between border-t px-6 py-4!">
            <p className="text-muted-foreground text-xs">
              Showing {invoices.length} payment
              {invoices.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" disabled>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" disabled>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <Dialog
        open={!!confirmResolveId}
        onOpenChange={(open) => !open && setConfirmResolveId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Manual Resolution</DialogTitle>
            <DialogDescription>
              Are you sure you want to resolve invoice{" "}
              <span className="text-foreground font-bold">
                {confirmResolveId}
              </span>{" "}
              manually?
              <br />
              <br />
              This will mark it as fully paid regardless of the actual amount
              sent on-chain, unlocking the service for your customer and
              deducting applicable platform fees from your balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-between">
            <Button variant="ghost" onClick={() => setConfirmResolveId(null)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              onClick={() => {
                if (confirmResolveId) onResolve(confirmResolveId);
                setConfirmResolveId(null);
              }}
            >
              <Check size={16} /> Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
