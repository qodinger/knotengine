"use client";

import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  HandCoins,
  History,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stakingAssets = [
  {
    id: "eth-lido",
    name: "Ethereum",
    symbol: "ETH",
    provider: "Lido Finance",
    apr: "3.4%",
    commission: "5%",
    totalStaked: "0.00",
    rewardsEarned: "0.0000",
    status: "active",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    description:
      "Deposit ETH and receive stETH, a liquid token that accrues rewards daily.",
  },
  {
    id: "ltc-yield",
    name: "Litecoin",
    symbol: "LTC",
    provider: "KnotEngine Yield",
    apr: "1.2%",
    commission: "10%",
    totalStaked: "0.00",
    rewardsEarned: "0.0000",
    status: "active",
    icon: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
    description:
      "Earn yield on your settled LTC through our institutional lending partners.",
  },
];

export default function StakingPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staking & Yield</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Put your settled funds to work and earn passive rewards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <History className="size-3.5" />
            Rewards History
          </Button>
          <Button className="h-9 gap-2 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700">
            <Zap className="size-3.5" />
            Auto-Stake Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-background/50 backdrop-blur-sm border-border/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Total Value Staked
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              $0.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>0% growth this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Accrued Rewards
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-500">
              +$0.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock className="size-3.5" />
              <span>Next payout in ~24h</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/40 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="size-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Yield Performance
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              2.8%{" "}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                Avg APR
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>Top-tier providers only</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {stakingAssets.map((asset) => (
          <Card
            key={asset.id}
            className="group hover:border-border/80 transition-all bg-background/50 backdrop-blur-sm border-border/40 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-primary/5 blur-3xl rounded-full" />

            <CardHeader className="relative pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 bg-transparent p-0 border border-white/5">
                    <AvatarImage src={asset.icon} className="object-contain" />
                    <AvatarFallback>{asset.symbol}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">
                      {asset.name}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1.5">
                      via{" "}
                      <span className="font-semibold text-foreground/80">
                        {asset.provider}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 font-bold px-2.5 py-0.5"
                >
                  {asset.apr} APR
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed h-10 line-clamp-2">
                {asset.description}
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Balance
                  </p>
                  <p className="text-sm font-mono font-bold">
                    {asset.totalStaked} {asset.symbol}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Profit (Yield)
                  </p>
                  <p className="text-sm font-mono font-bold text-emerald-500">
                    +{asset.rewardsEarned} {asset.symbol}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Info className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    KnotEngine Commission:{" "}
                    <span className="font-bold">
                      {asset.commission} of rewards
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="relative gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 font-bold text-[10px] uppercase tracking-widest border-white/5"
              >
                Manage
              </Button>
              <Button className="flex-1 h-10 font-bold text-[10px] uppercase tracking-widest gap-2">
                <HandCoins className="size-3.5" />
                Stake Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-2 border-border/40 bg-muted/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <Zap className="size-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">Enable Auto-Stake</h3>
          <p className="text-muted-foreground max-w-sm mb-6 text-xs leading-relaxed">
            Never let your capital sit idle. Every time a payment is settled,
            we&apos;ll automatically move it to your preferred staking pool.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              <CheckCircle2 className="size-4 text-emerald-500 relative z-30 bg-background rounded-full" />
              <div className="size-4 rounded-full bg-primary relative z-20 border-2 border-background" />
              <div className="size-4 rounded-full bg-blue-500 relative z-10 border-2 border-background" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              Used by 42% of merchants
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
