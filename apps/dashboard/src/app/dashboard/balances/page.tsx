"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Target,
  CreditCard,
  Activity,
  Plus,
  Loader2,
  Trash2,
  Wand2,
  Save,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  CRYPTO_LOGOS,
  CRYPTO_LABELS,
  EVM_CURRENCIES,
} from "@qodinger/knot-types";

interface MerchantProfile {
  id: string;
  name: string;
  btcXpub: string | null;
  ethAddress: string | null;
  btcXpubTestnet: string | null;
  ethAddressTestnet: string | null;
  enabledCurrencies: string[];
  feesAccrued: { usd: number } | null;
}

interface StatsData {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  feesAccrued: { usd: number };
  currentFeeRate: number;
}

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_currency: string;
  status: string;
  created_at: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export default function BalancesPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletCoin, setNewWalletCoin] = useState<string>("");
  const [newWalletNetwork, setNewWalletNetwork] = useState<string>("");
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  const [walletToRemove, setWalletToRemove] = useState<string | null>(null);
  const [isRemovingWallet, setIsRemovingWallet] = useState(false);

  // Smart Detection Logic
  const handleAddressChange = (val: string) => {
    setNewWalletAddress(val);
    const input = val.trim();
    if (!input) return;

    // 1. BTC/LTC xPub Detection (xpub, ypub, zpub, tpub, vpub, upub)
    if (/^[xyzvtu]pub[1-9A-HJ-NP-Za-km-z]{10,}$/i.test(input)) {
      setNewWalletCoin("BTC");
      setNewWalletNetwork("BTC");
      return;
    }

    // 2. Bitcoin Address Detection (1..., 3..., bc1...)
    if (/^(1|3|bc1q|bc1p)[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(input)) {
      setNewWalletCoin("BTC");
      setNewWalletNetwork("BTC");
      return;
    }

    // 3. Litecoin Address Detection (L..., M..., ltc1...)
    if (/^(L|M|ltc1)[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(input)) {
      setNewWalletCoin("LTC");
      setNewWalletNetwork("LTC");
      return;
    }

    // 4. EVM Address Detection (ETH, USDT)
    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
      if (
        !newWalletCoin ||
        newWalletCoin === "BTC" ||
        newWalletCoin === "LTC"
      ) {
        setNewWalletCoin("ETH");
        setNewWalletNetwork("ETH");
      }
      return;
    }
  };
  // Define Assets and their Networks
  const CONFIGURABLE_ASSETS = [
    { id: "BTC", label: "Bitcoin", symbol: "BTC", icon: CRYPTO_LOGOS.BTC },
    { id: "LTC", label: "Litecoin", symbol: "LTC", icon: CRYPTO_LOGOS.LTC },
    { id: "ETH", label: "Ethereum", symbol: "ETH", icon: CRYPTO_LOGOS.ETH },
    {
      id: "USDT",
      label: "Tether",
      symbol: "USDT",
      icon: CRYPTO_LOGOS.USDT_ERC20,
    },
  ];

  const NETWORKS: Record<
    string,
    { id: string; label: string; networkName: string }[]
  > = {
    BTC: [{ id: "BTC", label: "Bitcoin Network", networkName: "Bitcoin" }],
    LTC: [{ id: "LTC", label: "Litecoin Network", networkName: "Litecoin" }],
    ETH: [
      { id: "ETH", label: "Ethereum (ERC20)", networkName: "Ethereum (ERC20)" },
    ],
    USDT: [
      {
        id: "USDT_ERC20",
        label: "Ethereum (ERC20)",
        networkName: "Ethereum (ERC20)",
      },
      { id: "USDT_POLYGON", label: "Polygon Network", networkName: "Polygon" },
    ],
  };
  const fetchData = useCallback(async () => {
    try {
      const [merchantRes, statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/merchants/me/stats"),
        api.get("/v1/invoices", { params: { limit: 100 } }),
      ]);
      setMerchant(merchantRes.data);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyAddress = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncate = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const handleAddWallet = async () => {
    setIsAddingWallet(true);
    try {
      const payload: Record<string, any> = {};
      if (newWalletNetwork === "BTC" || newWalletNetwork === "LTC") {
        payload.btcXpub = newWalletAddress;
      } else {
        payload.ethAddress = newWalletAddress;
      }

      // Add to enabled list
      const updatedEnabled = [...(merchant?.enabledCurrencies || [])];
      if (!updatedEnabled.includes(newWalletNetwork)) {
        updatedEnabled.push(newWalletNetwork);
      }
      payload.enabledCurrencies = updatedEnabled;

      await api.patch("/v1/merchants/me", payload);
      await fetchData();
      setIsAddWalletOpen(false);
      setNewWalletAddress("");
    } catch (err) {
      console.error("Failed to add wallet", err);
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleRemoveWallet = async () => {
    if (!walletToRemove) return;
    setIsRemovingWallet(true);
    try {
      const payload: Record<string, any> = {};
      const updatedEnabled = (merchant?.enabledCurrencies || []).filter(
        (c) => c !== walletToRemove,
      );
      payload.enabledCurrencies = updatedEnabled;

      // Only nullify address if it was the last one using it
      const btcRelated = ["BTC", "LTC"];
      if (
        btcRelated.includes(walletToRemove) &&
        !updatedEnabled.some((c) => btcRelated.includes(c))
      ) {
        payload.btcXpub = null;
      }
      if (
        EVM_CURRENCIES.includes(walletToRemove as any) &&
        !updatedEnabled.some((c) => EVM_CURRENCIES.includes(c as any))
      ) {
        payload.ethAddress = null;
      }

      await api.patch("/v1/merchants/me", payload);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove wallet", err);
    } finally {
      setIsRemovingWallet(false);
      setWalletToRemove(null);
    }
  };

  // Analytics derived data
  const confirmedInvoices = invoices.filter(
    (inv) => inv.status === "confirmed",
  );
  const confirmedVolume = confirmedInvoices.reduce(
    (sum, inv) => sum + inv.amount_usd,
    0,
  );
  const avgTicket =
    confirmedInvoices.length > 0
      ? confirmedVolume / confirmedInvoices.length
      : 0;
  const conversionRate =
    invoices.length > 0
      ? ((confirmedInvoices.length / invoices.length) * 100).toFixed(1)
      : "0.0";

  // Daily chart data
  const dailyVolume = invoices.reduce(
    (acc: Record<string, { volume: number; count: number }>, inv) => {
      const date = new Date(inv.created_at).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (!acc[date]) acc[date] = { volume: 0, count: 0 };
      if (inv.status === "confirmed") acc[date].volume += inv.amount_usd;
      acc[date].count += 1;
      return acc;
    },
    {},
  );
  const chartData = Object.entries(dailyVolume).map(([name, data]) => ({
    name,
    volume: parseFloat(data.volume.toFixed(2)),
  }));

  // Currency breakdown
  const currencyBreakdown = invoices.reduce(
    (acc: Record<string, number>, inv) => {
      if (!acc[inv.crypto_currency]) acc[inv.crypto_currency] = 0;
      acc[inv.crypto_currency] += inv.amount_usd;
      return acc;
    },
    {},
  );
  const currencyData = Object.entries(currencyBreakdown)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value);

  const wallets = [];
  if (merchant) {
    const isEnabled = (id: string) => merchant.enabledCurrencies?.includes(id);

    if (merchant.btcXpub) {
      if (isEnabled("BTC")) {
        wallets.push({
          id: "BTC",
          label: CRYPTO_LABELS.BTC,
          currency: "BTC",
          network: "Bitcoin",
          address: merchant.btcXpub,
          type: "HD Wallet (xPub)",
          iconUrl: CRYPTO_LOGOS.BTC,
          iconColor: "bg-amber-500",
          iconFallback: "BTC",
        });
      }
      if (isEnabled("LTC")) {
        wallets.push({
          id: "LTC",
          label: CRYPTO_LABELS.LTC,
          currency: "LTC",
          network: "Litecoin",
          address: merchant.btcXpub,
          type: "HD Wallet (xPub)",
          iconUrl: CRYPTO_LOGOS.LTC,
          iconColor: "bg-blue-600",
          iconFallback: "LTC",
        });
      }
    }
    if (merchant.ethAddress) {
      if (isEnabled("ETH")) {
        wallets.push({
          id: "ETH",
          label: CRYPTO_LABELS.ETH,
          currency: "ETH",
          network: "Ethereum (ERC20)",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.ETH,
          iconColor: "bg-indigo-500",
          iconFallback: "ETH",
        });
      }
      if (isEnabled("USDT_ERC20")) {
        wallets.push({
          id: "USDT_ERC20",
          label: CRYPTO_LABELS.USDT_ERC20,
          currency: "USDT",
          network: "Ethereum (ERC20)",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.USDT_ERC20,
          iconColor: "bg-emerald-500",
          iconFallback: "USDT",
        });
      }
      if (isEnabled("USDT_POLYGON")) {
        wallets.push({
          id: "USDT_POLYGON",
          label: CRYPTO_LABELS.USDT_POLYGON,
          currency: "USDT",
          network: "Polygon",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.USDT_POLYGON,
          iconColor: "bg-emerald-600",
          iconFallback: "USDT",
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Balances</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your settlement wallets and performance analytics.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Volume",
            value: `$${confirmedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Avg. Ticket",
            value: `$${avgTicket.toFixed(2)}`,
            icon: CreditCard,
            color: "text-blue-500",
          },
          {
            label: "Conversion",
            value: `${conversionRate}%`,
            icon: Target,
            color: "text-purple-500",
          },
          {
            label: "Platform Fees",
            value: `$${(stats?.feesAccrued?.usd || 0).toFixed(2)}`,
            icon: Activity,
            color: "text-amber-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4"
          >
            <div
              className={cn(
                "size-9 rounded-lg flex items-center justify-center bg-muted/50",
                stat.color,
              )}
            >
              <stat.icon className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <p className="text-lg font-bold tracking-tight leading-none mt-0.5">
                {loading ? (
                  <span className="text-muted-foreground/30">—</span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Wallets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Settlement Wallets
          </h2>
          <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-2">
                <Plus className="size-3" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Settlement Wallet</DialogTitle>
                <DialogDescription>
                  Configure a new wallet to receive your settlements.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      className="w-full pr-10 font-mono text-sm h-11 bg-background/50 border-border/80"
                      placeholder="Paste your address here..."
                      value={newWalletAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      autoComplete="off"
                    />
                    {newWalletAddress && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in fade-in zoom-in duration-300">
                        <Wand2 className="size-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Wand2 className="size-2.5 opacity-50" />
                    Tip: Paste your wallet to auto-detect the network.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="coin">Coin</Label>
                    <Select
                      value={newWalletCoin}
                      onValueChange={(val) => {
                        setNewWalletCoin(val);
                        setNewWalletNetwork("");
                      }}
                    >
                      <SelectTrigger
                        id="coin"
                        className="w-full h-10! bg-background/50 border-border/80"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONFIGURABLE_ASSETS.map((asset) => {
                          const input = newWalletAddress.trim();
                          let isLocked = false;

                          if (input) {
                            const isXpub = /^[xyzvtu]pub/i.test(input);
                            const isBtcAddr = /^(1|3|bc1q|bc1p)/i.test(input);
                            const isLtcAddr = /^(L|M|ltc1)/i.test(input);
                            const isEvmAddr = /^0x/i.test(input);

                            if (isXpub || isBtcAddr) {
                              isLocked = !["BTC", "LTC"].includes(asset.id);
                            } else if (isLtcAddr) {
                              isLocked = asset.id !== "LTC";
                            } else if (isEvmAddr) {
                              isLocked = !["ETH", "USDT"].includes(asset.id);
                            }
                          }

                          return (
                            <SelectItem
                              key={asset.id}
                              value={asset.id}
                              disabled={isLocked}
                              className="h-10!"
                            >
                              <div className="flex items-center gap-2">
                                <span>{asset.label}</span>
                                {isLocked && (
                                  <span className="text-[9px] text-muted-foreground ml-auto opacity-50">
                                    (Incompatible)
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="network">Network</Label>
                    <Select
                      value={newWalletNetwork}
                      onValueChange={setNewWalletNetwork}
                      disabled={!newWalletCoin}
                    >
                      <SelectTrigger
                        id="network"
                        className="w-full h-10! bg-background/50 border-border/80 disabled:opacity-40"
                      >
                        <SelectValue placeholder="Network" />
                      </SelectTrigger>
                      <SelectContent>
                        {newWalletCoin &&
                          NETWORKS[newWalletCoin]?.map((network) => (
                            <SelectItem
                              key={network.id}
                              value={network.id}
                              className="h-10!"
                            >
                              {network.networkName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newWalletNetwork === "USDT_POLYGON" && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-emerald-600 font-medium leading-relaxed">
                      Smart Match: This network shares the same address as your
                      Ethereum (ERC20) wallet.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
                <Button
                  variant="outline"
                  onClick={() => setIsAddWalletOpen(false)}
                  className="h-10 font-bold uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWallet}
                  className="h-10 font-bold uppercase text-[10px] tracking-widest"
                  disabled={
                    isAddingWallet ||
                    !newWalletAddress ||
                    !newWalletNetwork ||
                    !!(
                      newWalletNetwork &&
                      (newWalletNetwork === "BTC" || newWalletNetwork === "LTC"
                        ? merchant?.btcXpub === newWalletAddress.trim()
                        : merchant?.ethAddress === newWalletAddress.trim()) &&
                      merchant?.enabledCurrencies.includes(newWalletNetwork)
                    )
                  }
                >
                  {isAddingWallet ? (
                    <Loader2 className="mr-2 size-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-3" />
                  )}
                  {(() => {
                    const isAlreadyEnabled =
                      merchant?.enabledCurrencies.includes(newWalletNetwork);
                    const currentSaved =
                      newWalletNetwork === "BTC" || newWalletNetwork === "LTC"
                        ? merchant?.btcXpub
                        : merchant?.ethAddress;
                    const isSameAddress =
                      currentSaved === newWalletAddress.trim();

                    if (isAlreadyEnabled && isSameAddress)
                      return "Already Configured";
                    if (isAlreadyEnabled && !isSameAddress)
                      return "Update Wallet";
                    return "Confirm Wallet";
                  })()}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {wallets.length === 0 ? (
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Wallet className="size-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60 mb-1">
                No wallets configured
              </p>
              <p className="text-xs text-muted-foreground/40 max-w-xs mb-4">
                Add your BTC xPub or ETH address to receive non-custodial
                payments.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddWalletOpen(true)}
              >
                <Plus className="size-3 mr-2" />
                Add Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <div className="divide-y divide-border/40">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="size-10 bg-transparent p-0 shrink-0">
                      <AvatarImage
                        src={wallet.iconUrl}
                        className="object-contain"
                      />
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-bold text-white",
                          wallet.iconColor,
                        )}
                      >
                        {wallet.iconFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          {wallet.label}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium"
                        >
                          {wallet.network}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {wallet.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-muted/30 p-2 rounded-lg border border-border/30 w-full sm:w-auto">
                    <code className="text-xs font-mono text-muted-foreground truncate flex-1 sm:max-w-xs px-1">
                      {truncate(wallet.address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => copyAddress(wallet.address, wallet.id)}
                    >
                      {copiedField === wallet.id ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      onClick={() => setWalletToRemove(wallet.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Dialog
          open={!!walletToRemove}
          onOpenChange={(open) => !open && setWalletToRemove(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Remove Settlement Wallet?</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this wallet? Any active
                transactions or pending payouts might be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setWalletToRemove(null)}
                disabled={isRemovingWallet}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveWallet}
                disabled={isRemovingWallet}
              >
                {isRemovingWallet && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Remove Wallet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Non-custodial notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          <span>
            Non-custodial — all payments settle directly to your wallets.
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card className="lg:col-span-4 border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Settlement Volume
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirmed invoice volume by day
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium">
                {invoices.length} invoices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="balanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      fontSize: "12px",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                No volume data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Currency Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Volume by cryptocurrency
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {currencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currencyData}
                  layout="vertical"
                  margin={{ left: -20, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--border)"
                    opacity={0.3}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.1 }}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      fontSize: "12px",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [
                      `$${Number(value ?? 0).toFixed(2)}`,
                      "Volume",
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {currencyData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                No invoice data to analyze
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
