"use client";

import { useState } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Coins,
  ArrowRightLeft,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MOCK_WALLETS = [
  {
    id: "wlt_1",
    label: "Main Treasury",
    currency: "USDT",
    network: "Polygon",
    address: "0x742d...44e",
    balance: 12540.5,
    utilization: 65,
    status: "active",
  },
  {
    id: "wlt_2",
    label: "Settlement Pool A",
    currency: "USDC",
    network: "Ethereum",
    address: "0x123a...98b",
    balance: 8900.2,
    utilization: 40,
    status: "active",
  },
  {
    id: "wlt_3",
    label: "Hot Wallet (Ops)",
    currency: "POL",
    network: "Polygon",
    address: "0xdef4...21c",
    balance: 450.0,
    utilization: 12,
    status: "warning",
  },
];

export default function WalletsPage() {
  const [loading] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Wallet Infrastructure
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage settlement addresses and automated liquidity dispersal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            Sync Chain
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="size-3" />
            Connect Wallet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10 shadow-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-4 -mt-4 transition-transform group-hover:scale-110">
            <ShieldCheck className="size-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Total Liquidity
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tighter">
              $21,890.70
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
              <ArrowUpRight className="size-3" />
              +4.2% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/20 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              Available to Sweep
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tighter">
              $15,620.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
              <RefreshCw className="size-3" />
              Next sync: 12 minutes
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/20 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              Active Yield
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tighter text-emerald-500">
              $242.15
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
              <ArrowUpRight className="size-3" />
              8.2% APY (Avg)
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
          <Wallet className="size-3" />
          Provisioned Wallet Pool
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_WALLETS.map((wallet) => (
            <Card
              key={wallet.id}
              className="border-none bg-background/50 border hover:bg-background/80 transition-all group"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center shadow-inner",
                        wallet.status === "warning"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Coins className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight">
                        {wallet.label}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-wider py-0 h-4 border-muted/50"
                        >
                          {wallet.network}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {wallet.address}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="size-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8">
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Current Balance
                    </p>
                    <p className="text-2xl font-bold tracking-tighter">
                      {wallet.balance.toLocaleString()} {wallet.currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Utilization
                    </p>
                    <p className="font-bold text-sm">{wallet.utilization}%</p>
                  </div>
                </div>
                <Progress value={wallet.utilization} className="h-1.5" />
              </CardContent>
              <CardFooter className="pt-0 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 font-bold uppercase text-[9px] tracking-widest gap-2"
                >
                  <RefreshCw className="size-3" />
                  Refresh
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 font-bold uppercase text-[9px] tracking-widest gap-2"
                >
                  <ArrowRightLeft className="size-3" />
                  Sweep
                </Button>
                <Button variant="secondary" size="sm" className="size-8 p-0">
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
          <Button
            variant="outline"
            className="h-full min-h-[220px] border-dashed border-2 hover:bg-primary/5 hover:border-primary/20 transition-all flex flex-col gap-4 text-muted-foreground hover:text-primary group"
          >
            <div className="size-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="size-6" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">Provision New Wallet</p>
              <p className="text-xs">Scale your settlement infrastructure</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
