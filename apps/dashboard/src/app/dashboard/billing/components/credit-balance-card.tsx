import { Coins, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatsData } from "../types";

interface CreditBalanceCardProps {
  stats: StatsData | null;
  loading: boolean;
}

export function CreditBalanceCard({ stats, loading }: CreditBalanceCardProps) {
  const creditBalance = stats?.creditBalance ?? 0;
  const feesAccrued = stats?.feesAccrued?.usd ?? 0;
  const feeRate = stats?.currentFeeRate ?? 0.01;
  const totalVolume = stats?.totalVolume ?? 0;

  const creditHealth =
    creditBalance > 3 ? "healthy" : creditBalance > 0 ? "warning" : "critical";

  const creditPercent = Math.min((creditBalance / 10) * 100, 100);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border",
        creditHealth === "critical"
          ? "border-rose-500/30 bg-rose-500/3"
          : creditHealth === "warning"
            ? "border-amber-500/30 bg-amber-500/3"
            : "border-emerald-500/20 bg-emerald-500/2",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-[0.03]",
          creditHealth === "critical"
            ? "bg-linear-to-br from-rose-500 to-transparent"
            : creditHealth === "warning"
              ? "bg-linear-to-br from-amber-500 to-transparent"
              : "bg-linear-to-br from-emerald-500 to-transparent",
        )}
      />

      <CardContent className="relative p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Coins
                className={cn(
                  "size-5",
                  creditHealth === "critical"
                    ? "text-rose-500"
                    : creditHealth === "warning"
                      ? "text-amber-500"
                      : "text-emerald-500",
                )}
              />
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Credit Balance
              </span>
              <Badge
                variant={
                  creditHealth === "critical"
                    ? "destructive"
                    : creditHealth === "warning"
                      ? "outline"
                      : "secondary"
                }
                className="ml-auto h-5 px-2 text-[9px] font-bold tracking-wider uppercase"
              >
                {creditHealth === "critical"
                  ? "DEPLETED"
                  : creditHealth === "warning"
                    ? "LOW"
                    : "ACTIVE"}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight tabular-nums">
                {loading ? (
                  <span className="text-muted-foreground/20">—</span>
                ) : (
                  `$${creditBalance.toFixed(2)}`
                )}
              </span>
              <span className="text-muted-foreground text-sm font-medium">
                USD
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Balance Level</span>
                <span className="font-medium">
                  {creditHealth === "critical"
                    ? "Depleted"
                    : creditHealth === "warning"
                      ? "Running Low"
                      : "Healthy"}
                </span>
              </div>
              <Progress
                value={creditPercent}
                className={cn(
                  "h-2",
                  creditHealth === "critical"
                    ? "[&>div]:bg-rose-500"
                    : creditHealth === "warning"
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500",
                )}
              />
            </div>

            {creditHealth === "critical" && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-500">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-xs font-medium">
                  Your account is locked. Top up to resume creating invoices.
                </p>
              </div>
            )}

            {creditHealth === "warning" && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-xs font-medium">
                  Low balance. Top up soon to avoid service interruption.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/60 border-border/40 flex flex-col gap-1 rounded-xl border p-4">
              <span className="text-muted-foreground flex justify-between text-[10px] font-bold tracking-wider uppercase">
                <span>Fee Rate</span>
                {!loading && (
                  <span className="text-primary/60">{stats?.currentPlan}</span>
                )}
              </span>
              <span className="text-xl font-bold">
                {loading ? "—" : `${(feeRate * 100).toFixed(2)}%`}
              </span>
              <span className="text-muted-foreground text-[10px] font-medium">
                Per confirmed invoice
              </span>
            </div>

            <div className="bg-background/60 border-border/40 flex flex-col gap-1 rounded-xl border p-4">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Fees Paid
              </span>
              <span className="text-xl font-bold">
                {loading ? "—" : `$${feesAccrued.toFixed(2)}`}
              </span>
              <span className="text-muted-foreground text-[10px] font-medium">
                Production usage
              </span>
            </div>

            <div className="bg-background/60 border-border/40 flex flex-col gap-1 rounded-xl border p-4">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Production Volume
              </span>
              <span className="text-lg font-bold">
                {loading
                  ? "—"
                  : `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground text-[10px] font-medium">
                  Real settlements
                </span>
              </div>
            </div>

            <div className="bg-background/60 border-border/40 flex flex-col gap-1 rounded-xl border p-4">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Testnet Volume
              </span>
              <span className="text-lg font-bold">
                {loading
                  ? "—"
                  : `$${(stats?.testnetVolume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  Simulation
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
