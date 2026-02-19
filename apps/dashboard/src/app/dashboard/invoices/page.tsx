"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ExternalLink,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type Invoice = {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  confirmations: number;
  required_confirmations: number;
  tx_hash: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  metadata?: {
    isTestnet?: boolean;
    network?: string;
  };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/v1/invoices", {
        params,
      });
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, fetchInvoices]);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.crypto_currency.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ledger Operations
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Monitor and audit all incoming merchant payment requests.
          </p>
        </div>
        <Button className="font-bold uppercase text-[10px] tracking-widest gap-2">
          <Plus className="size-3" />
          Create Settlement
        </Button>
      </div>

      <Card className="border-none shadow-none bg-background/50 border overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Lookup by Invoice ID or Currency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-none transition-all hover:bg-background/80"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-background/50 border-none text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 font-bold uppercase text-[10px] tracking-widest"
              >
                <Filter className="size-3" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[200px] text-[10px] font-bold uppercase tracking-wider h-10">
                  Invoice ID
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-right">
                  Settlement (USD)
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">
                  Asset Pool
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">
                  Timestamp
                </TableHead>
                <TableHead className="text-right h-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-b last:border-0">
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground font-medium"
                  >
                    No ledger entries matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow
                    key={inv.invoice_id}
                    className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold tracking-tight text-primary">
                          {inv.invoice_id}
                        </span>
                        {inv.metadata?.isTestnet && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[9px] h-4 py-0 px-1 border-yellow-500/20 text-yellow-500 bg-yellow-500/5"
                          >
                            TESTNET
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      $
                      {inv.amount_usd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">
                          {inv.crypto_amount}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] py-0 px-1.5 h-4 font-bold tracking-wider"
                        >
                          {inv.crypto_currency}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {format(new Date(inv.created_at), "MMM d, HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Operations
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs font-medium"
                            onClick={() =>
                              window.open(
                                `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/checkout/${inv.invoice_id}`,
                                "_blank",
                              )
                            }
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Launch Checkout
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-medium">
                            Copy Entry ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="py-4 border-t bg-muted/20 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-medium">
            Showing 1-10 of {filteredInvoices.length} transactions
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" className="size-8" disabled>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" className="size-8" disabled>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const configs: Record<
    string,
    {
      label: string;
      icon: React.ComponentType<{ size?: number }>;
      className: string;
    }
  > = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    confirmed: {
      label: "Settled",
      icon: CheckCircle2,
      className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    expired: {
      label: "Expired",
      icon: XCircle,
      className: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    partially_paid: {
      label: "Partial",
      icon: AlertCircle,
      className: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    },
  };

  const config = configs[status] || {
    label: status,
    icon: AlertCircle,
    className: "text-gray-500 bg-gray-500/10 border-gray-500/20",
  };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] border-none shadow-none",
        config.className,
      )}
    >
      <Icon size={10} />
      {config.label}
    </Badge>
  );
}
