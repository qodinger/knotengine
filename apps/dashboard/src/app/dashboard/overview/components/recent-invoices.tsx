"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Receipt,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "../types";

interface RecentInvoicesProps {
  invoices: Invoice[];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <Card className="lg:col-span-3 bg-card/40 border-border/50 backdrop-blur-md shadow-sm flex flex-col">
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Latest invoices from your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {invoices.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="size-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/60">
              No invoices yet
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              Create your first invoice to start tracking activity.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {invoices.map((inv) => (
              <div key={inv.invoice_id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center shrink-0",
                    inv.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : inv.status === "expired"
                        ? "bg-rose-500/10 text-rose-500"
                        : inv.status === "partially_paid"
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {inv.status === "confirmed" ? (
                    <CheckCircle2 className="size-4" />
                  ) : inv.status === "expired" ? (
                    <XCircle className="size-4" />
                  ) : inv.status === "partially_paid" ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <p className="text-xs font-mono font-medium leading-none truncate">
                    {inv.invoice_id}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[9px] py-0 px-1.5 h-4 font-bold tracking-wider"
                    >
                      {inv.crypto_currency}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-2.5" />
                      {format(new Date(inv.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
                <div className="font-bold text-sm shrink-0">
                  <span
                    className={cn(
                      inv.status === "confirmed"
                        ? "text-emerald-500"
                        : "text-foreground",
                    )}
                  >
                    {inv.status === "confirmed" ? "+" : ""}$
                    {inv.amount_usd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href="/dashboard/payments">
            View all payments
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
