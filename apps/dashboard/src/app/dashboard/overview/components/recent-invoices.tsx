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
    <Card className="bg-card/40 border-border/50 flex flex-col shadow-sm backdrop-blur-md lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Latest invoices from your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {invoices.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <Receipt className="text-muted-foreground/20 mb-3 size-10" />
            <p className="text-muted-foreground/60 text-sm font-medium">
              No invoices yet
            </p>
            <p className="text-muted-foreground/40 mt-1 text-xs">
              Create your first invoice to start tracking activity.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {invoices.map((inv) => (
              <div key={inv.invoice_id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
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
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate font-mono text-xs leading-none font-medium">
                    {inv.invoice_id}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 py-0 text-[9px] font-bold tracking-wider"
                    >
                      {inv.crypto_currency}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Calendar className="size-2.5" />
                      {format(new Date(inv.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold">
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
          <Link href="/dashboard/payments" prefetch={false}>
            View all payments
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
