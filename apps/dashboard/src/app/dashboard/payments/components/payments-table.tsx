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
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full lg:w-auto"
        >
          <TabsList className="bg-muted/30 h-9">
            <TabsTrigger value="all" className="text-xs font-medium px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs font-medium px-3">
              Succeeded
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs font-medium px-3">
              Pending
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs font-medium px-3">
              Expired
            </TabsTrigger>
            <TabsTrigger
              value="testnet"
              className="text-xs font-medium px-3 gap-1.5"
            >
              <span className="size-1.5 rounded-full bg-yellow-500 shrink-0" />
              Testnet
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-muted/30 border-none text-sm"
          />
        </div>
      </div>

      <Card className="border shadow-sm overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30 h-12">
                <TableHead className="w-[220px] text-[10px] font-bold uppercase tracking-wider pl-6">
                  Amount
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                  Invoice ID
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                  Currency
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/20">
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
                      <Skeleton className="h-5 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
                        <CreditCard className="size-6 text-muted-foreground/20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          No payments found
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                    className="border-b border-border/20 hover:bg-muted/5 transition-colors group cursor-pointer"
                    onClick={() => openInvoiceDetails(inv)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          $
                          {inv.amount_usd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {inv.crypto_amount} {inv.crypto_currency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {inv.invoice_id}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(inv.invoice_id, inv.invoice_id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId === inv.invoice_id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        {inv.metadata?.isTestnet && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 py-0 px-1 border-yellow-500/20 text-yellow-500 bg-yellow-500/5"
                          >
                            TEST
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-5 font-semibold tracking-wide"
                      >
                        {inv.crypto_currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {format(new Date(inv.created_at), "MMM d, HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
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
                                className="text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 focus:text-emerald-600 focus:bg-emerald-500/5"
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
          <CardFooter className="py-4! px-6 border-t flex items-center justify-between bg-muted/5">
            <p className="text-xs text-muted-foreground">
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
              <span className="font-bold text-foreground">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"
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
