"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Coins,
  Plus,
  AlertCircle,
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
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";

interface MerchantProfile {
  id: string;
  name: string;
  btcXpub: string | null;
  ethAddress: string | null;
  feesAccrued: { usd: number } | null;
}

interface StatsData {
  currentFeeRate: number;
}

export default function WalletsPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchMerchant = useCallback(async () => {
    try {
      const [merchantRes, statsRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/merchants/me/stats"),
      ]);
      setMerchant(merchantRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch merchant profile", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  const copyAddress = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncate = (addr: string) => {
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const configuredWallets = [];
  if (merchant?.btcXpub) {
    configuredWallets.push({
      id: "btc",
      label: "Bitcoin HD Wallet",
      currency: "BTC",
      network: "Bitcoin",
      address: merchant.btcXpub,
      type: "xPub (HD Derivation)",
    });
  }
  if (merchant?.ethAddress) {
    configuredWallets.push({
      id: "eth",
      label: "EVM Settlement Address",
      currency: "ETH / ERC-20",
      network: "Ethereum / Polygon",
      address: merchant.ethAddress,
      type: "Static Address",
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Wallet Infrastructure
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Your configured settlement addresses for receiving payments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
            onClick={fetchMerchant}
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
            asChild
          >
            <Link href="/dashboard/settings">
              <Plus className="size-3" />
              Configure Wallets
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/10 shadow-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-4 -mt-4 transition-transform group-hover:scale-110">
            <ShieldCheck className="size-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Configured Wallets
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tighter">
              {loading ? (
                <span className="text-muted-foreground/30">—</span>
              ) : (
                configuredWallets.length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
              <ShieldCheck className="size-3" />
              Non-custodial — you control all keys
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/20 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              Fees Accrued
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tighter">
              {loading ? (
                <span className="text-muted-foreground/30">—</span>
              ) : (
                `$${(merchant?.feesAccrued?.usd || 0).toFixed(2)}`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
              <Coins className="size-3" />
              Platform fee:{" "}
              {stats ? `${(stats.currentFeeRate * 100).toFixed(2)}%` : "—"} per
              settlement
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
          <Wallet className="size-3" />
          Settlement Addresses
        </h2>

        {configuredWallets.length === 0 ? (
          <Card className="border-dashed border-2 border-border/40 bg-background/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                <AlertCircle className="size-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground/70 mb-1">
                No wallets configured
              </h3>
              <p className="text-xs text-muted-foreground/50 max-w-sm mb-4">
                Add your BTC xPub or ETH address in Settings to start receiving
                non-custodial payments.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">Go to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {configuredWallets.map((wallet) => (
              <Card
                key={wallet.id}
                className="border-none bg-background/50 border hover:bg-background/80 transition-all group"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
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
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-bold uppercase tracking-wider py-0 h-4"
                          >
                            {wallet.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Address / Key
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted/30 rounded px-2 py-1.5 flex-1 truncate">
                        {truncate(wallet.address)}
                      </code>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => copyAddress(wallet.address, wallet.id)}
                      >
                        {copiedField === wallet.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Currency Support
                    </p>
                    <p className="text-sm font-bold">{wallet.currency}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 font-bold uppercase text-[9px] tracking-widest gap-2"
                    asChild
                  >
                    <Link href="/dashboard/settings">
                      <RefreshCw className="size-3" />
                      Update in Settings
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Button
              variant="outline"
              className="h-full min-h-[220px] border-dashed border-2 hover:bg-primary/5 hover:border-primary/20 transition-all flex flex-col gap-4 text-muted-foreground hover:text-primary group"
              asChild
            >
              <Link href="/dashboard/settings">
                <div className="size-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Plus className="size-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Add New Address</p>
                  <p className="text-xs">
                    Configure additional wallet addresses in Settings
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card className="border-none shadow-none bg-background/50 border">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground mb-1">
                Non-Custodial Architecture
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                KnotEngine never holds your funds. All payments are sent
                directly to your configured wallet addresses. For BTC, we use HD
                derivation (xPub) to generate unique addresses per invoice. For
                EVM tokens, your static Ethereum address is used.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
