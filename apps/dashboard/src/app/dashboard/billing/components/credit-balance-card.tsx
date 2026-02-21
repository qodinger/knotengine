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
        "border relative overflow-hidden",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
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
                className="text-[10px] font-bold ml-auto"
              >
                {creditHealth === "critical"
                  ? "DEPLETED"
                  : creditHealth === "warning"
                    ? "LOW"
                    : "ACTIVE"}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter tabular-nums">
                {loading ? (
                  <span className="text-muted-foreground/20">—</span>
                ) : (
                  `$${creditBalance.toFixed(2)}`
                )}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                USD
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Credit Usage</span>
                <span className="font-mono">
                  ${creditBalance.toFixed(2)} / $10.00
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-xs font-medium">
                  Your account is locked. Top up to resume creating invoices.
                </p>
              </div>
            )}

            {creditHealth === "warning" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-xs font-medium">
                  Low balance. Top up soon to avoid service interruption.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Fee Rate
              </span>
              <span className="text-xl font-bold">
                {loading ? "—" : `${(feeRate * 100).toFixed(1)}%`}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Per confirmed invoice
              </span>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Fees Paid
              </span>
              <span className="text-xl font-bold">
                {loading ? "—" : `$${feesAccrued.toFixed(2)}`}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Production usage
              </span>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Production Volume
              </span>
              <span className="text-lg font-bold">
                {loading
                  ? "—"
                  : `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  Real settlements
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Testnet Volume
              </span>
              <span className="text-lg font-bold">
                {loading
                  ? "—"
                  : `$${(stats?.testnetVolume ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10px] text-muted-foreground uppercase">
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
