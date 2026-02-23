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
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staking & Yield</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Put your settled funds to work and earn passive rewards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 text-xs font-bold tracking-widest uppercase"
          >
            <History className="size-3.5" />
            Rewards History
          </Button>
          <Button className="h-9 gap-2 bg-emerald-600 text-xs font-bold tracking-widest uppercase hover:bg-emerald-700">
            <Zap className="size-3.5" />
            Auto-Stake Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="bg-background/50 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Total Value Staked
            </CardDescription>
            <CardTitle className="font-mono text-2xl font-bold">
              $0.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>0% growth this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Accrued Rewards
            </CardDescription>
            <CardTitle className="font-mono text-2xl font-bold text-emerald-500">
              +$0.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Clock className="size-3.5" />
              <span>Next payout in ~24h</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 border-border/40 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="text-primary size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Yield Performance
            </CardDescription>
            <CardTitle className="font-mono text-2xl font-bold">
              2.8%{" "}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                Avg APR
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheck className="text-primary size-3.5" />
              <span>Top-tier providers only</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {stakingAssets.map((asset) => (
          <Card
            key={asset.id}
            className="group hover:border-border/80 bg-background/50 border-border/40 overflow-hidden backdrop-blur-sm transition-all"
          >
            <div className="bg-primary/5 absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full blur-3xl" />

            <CardHeader className="relative pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-white/5 bg-transparent p-0">
                    <AvatarImage src={asset.icon} className="object-contain" />
                    <AvatarFallback>{asset.symbol}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">
                      {asset.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      via{" "}
                      <span className="text-foreground/80 font-semibold">
                        {asset.provider}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 font-bold"
                >
                  {asset.apr} APR
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <p className="text-muted-foreground line-clamp-2 h-10 text-sm leading-relaxed">
                {asset.description}
              </p>

              <div className="bg-muted/30 border-border/40 grid grid-cols-2 gap-4 rounded-xl border p-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                    Balance
                  </p>
                  <p className="font-mono text-sm font-bold">
                    {asset.totalStaked} {asset.symbol}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                    Profit (Yield)
                  </p>
                  <p className="font-mono text-sm font-bold text-emerald-500">
                    +{asset.rewardsEarned} {asset.symbol}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Info className="text-muted-foreground size-3.5" />
                  <span className="text-muted-foreground text-[11px]">
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
                className="h-10 flex-1 border-white/5 text-[10px] font-bold tracking-widest uppercase"
              >
                Manage
              </Button>
              <Button className="h-10 flex-1 gap-2 text-[10px] font-bold tracking-widest uppercase">
                <HandCoins className="size-3.5" />
                Stake Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 bg-muted/5 border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary/10 border-primary/20 mb-4 flex size-10 items-center justify-center rounded-full border">
            <Zap className="text-primary size-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold">Enable Auto-Stake</h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-xs leading-relaxed">
            Never let your capital sit idle. Every time a payment is settled,
            we&apos;ll automatically move it to your preferred staking pool.
          </p>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex -space-x-2">
              <CheckCircle2 className="bg-background relative z-30 size-4 rounded-full text-emerald-500" />
              <div className="bg-primary border-background relative z-20 size-4 rounded-full border-2" />
              <div className="border-background relative z-10 size-4 rounded-full border-2 bg-blue-500" />
            </div>
            <span className="text-muted-foreground text-[11px] font-medium">
              Used by 42% of merchants
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
