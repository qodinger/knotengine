"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Coins,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Sparkles,
  Loader2,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Currency } from "@knotengine/types";

interface StatsData {
  totalVolume: number;
  activeInvoices: number;
  feesAccrued: { usd: number };
  creditBalance: number;
  currentFeeRate: number;
  platformFeeWallets: {
    BTC: string | null;
    LTC: string | null;
    EVM: string | null;
  };
}

export default function BillingPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Claiming State
  const [txHash, setTxHash] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | "">("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpStep, setTopUpStep] = useState<1 | 2>(1);
  const [usdAmount, setUsdAmount] = useState<string>("10.00");
  const [cryptoAmount, setCryptoAmount] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
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

  const resetTopUpModal = () => {
    setTopUpStep(1);
    setIsGenerating(false);
    setGenerateError(null);
    setTxHash("");
    setClaimStatus(null);
  };

  const handleOpenTopUp = () => {
    resetTopUpModal();
    setIsTopUpOpen(true);
  };

  const getWalletAddress = (currency: string) => {
    if (!stats?.platformFeeWallets) return null;
    if (currency === "BTC") return stats.platformFeeWallets.BTC;
    if (currency === "LTC") return stats.platformFeeWallets.LTC;
    return stats.platformFeeWallets.EVM;
  };

  const handleGeneratePayment = async () => {
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
      setGenerateError("Please enter a valid USD amount.");
      return;
    }
    if (!selectedCurrency) {
      setGenerateError("Please select a cryptocurrency.");
      return;
    }
    const address = getWalletAddress(selectedCurrency);
    if (!address) {
      setGenerateError("Platform wallet not configured for this currency.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.get(`/v1/price/${selectedCurrency}`);
      const price = res.data?.price_usd;
      if (price && price > 0) {
        setCryptoAmount(Number(usdAmount) / price);
        setTopUpStep(2);
      } else {
        setGenerateError("Unable to fetch price, please try again.");
      }
    } catch {
      setGenerateError("Failed to fetch current currency price.");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitClaim = async () => {
    if (!txHash || txHash.length < 10) {
      setClaimStatus({ error: "Please enter a valid Transaction Hash." });
      return;
    }
    if (!selectedCurrency) {
      setClaimStatus({ error: "Please select the currency you sent." });
      return;
    }

    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const res = await api.post("/v1/merchants/me/topup", {
        txHash: txHash.trim(),
        currency: selectedCurrency,
      });
      setClaimStatus({
        success: true,
        message: `Success! Added $${res.data.addedUsd.toFixed(2)} to your balance.`,
      });
      setTxHash("");
      await fetchData(); // Refresh billing data
    } catch (err: unknown) {
      let errorResponse = "Failed to verify transaction.";
      if (axios.isAxiosError(err)) {
        errorResponse = err.response?.data?.error || errorResponse;
      }
      setClaimStatus({
        error: errorResponse,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  // Computed values
  const creditBalance = stats?.creditBalance ?? 0;
  const feesAccrued = stats?.feesAccrued?.usd ?? 0;
  const feeRate = stats?.currentFeeRate ?? 0.01;
  const totalVolume = stats?.totalVolume ?? 0;

  // Calculate how much processing volume the credit can cover
  const remainingVolume = feeRate > 0 ? creditBalance / feeRate : 0;

  // Credit health status
  const creditHealth =
    creditBalance > 3 ? "healthy" : creditBalance > 0 ? "warning" : "critical";

  // Progress bar: show credit as % of $10 (arbitrary "full" visualization)
  const creditPercent = Math.min((creditBalance / 10) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your prepaid credit balance and view platform usage fees.
        </p>
      </div>

      {/* Credit Balance Hero Card */}
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
        {/* Decorative gradient */}
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
            {/* Left: Balance Display */}
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

            {/* Right: Quick Stats */}
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
                  Total Fees Paid
                </span>
                <span className="text-xl font-bold">
                  {loading ? "—" : `$${feesAccrued.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Lifetime usage
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Volume Processed
                </span>
                <span className="text-xl font-bold">
                  {loading
                    ? "—"
                    : `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Confirmed settlements
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-xl bg-background/60 border border-border/40">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Remaining Capacity
                </span>
                <span className="text-xl font-bold">
                  {loading
                    ? "—"
                    : `$${remainingVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Before top-up needed
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top-Up Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Top Up Credits
          </h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg mb-4">
          Add credits to your account to securely process payments and cover
          platform network fees.
        </p>

        {!stats?.platformFeeWallets?.BTC &&
        !stats?.platformFeeWallets?.LTC &&
        !stats?.platformFeeWallets?.EVM ? (
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Coins className="size-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60 mb-1">
                No top-up wallets configured
              </p>
              <p className="text-xs text-muted-foreground/40 max-w-xs">
                Platform fee wallets have not been set up yet. Contact the
                platform administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={handleOpenTopUp}
            size="lg"
            className="w-full sm:w-auto gap-2"
          >
            <Zap className="size-4" />
            Top Up Credits Now
          </Button>
        )}
      </div>

      <Dialog
        open={isTopUpOpen}
        onOpenChange={(open) => {
          if (!open && !isClaiming) setIsTopUpOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-background">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center justify-between text-xl font-bold font-mono">
                {topUpStep === 1 ? "Select Top-Up Amount" : "Pay with Crypto"}
                {topUpStep === 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTopUpStep(1)}
                    className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                  >
                    &larr; Back
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {topUpStep === 1
                    ? "Enter how much you want to add to your prepaid balance, and choose a cryptocurrency."
                    : "Send the exact cryptocurrency amount to the address below. Your balance updates instantly after confirmation."}
                </div>
              </DialogDescription>
            </DialogHeader>

            {topUpStep === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-7 h-11 text-lg font-bold font-mono shadow-sm bg-background/50 border-border/80"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      placeholder="10.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Pay With (Currency)
                  </label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(val) =>
                      setSelectedCurrency(val as Currency)
                    }
                  >
                    <SelectTrigger className="w-full h-11 shadow-sm bg-background/50 border-border/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent className="[&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
                      {stats?.platformFeeWallets?.EVM ? ( // Check for EVM wallet for all EVM-based options
                        <>
                          <SelectItem value="USDT_ERC20">
                            <Avatar className="size-5 bg-transparent p-0">
                              <AvatarImage
                                src={CRYPTO_LOGOS.USDT_ERC20}
                                className="object-contain"
                              />
                              <AvatarFallback className="text-[10px] bg-emerald-500 text-white">
                                USDT
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              Tether (USDT) on Ethereum
                            </span>
                          </SelectItem>
                          <SelectItem value="USDT_POLYGON">
                            <Avatar className="size-5 bg-transparent p-0">
                              <AvatarImage
                                src={CRYPTO_LOGOS.USDT_POLYGON}
                                className="object-contain"
                              />
                              <AvatarFallback className="text-[10px] bg-emerald-500 text-white">
                                USDT
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              Tether (USDT) on Polygon
                            </span>
                          </SelectItem>
                          <SelectItem value="ETH">
                            <Avatar className="size-5 bg-transparent p-0">
                              <AvatarImage
                                src={CRYPTO_LOGOS.ETH}
                                className="object-contain"
                              />
                              <AvatarFallback className="text-[10px] bg-indigo-500 text-white">
                                ETH
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">Ethereum (ETH)</span>
                          </SelectItem>
                        </>
                      ) : null}
                      {stats?.platformFeeWallets?.BTC && (
                        <SelectItem value="BTC">
                          <Avatar className="size-5 bg-transparent p-0">
                            <AvatarImage
                              src={CRYPTO_LOGOS.BTC}
                              className="object-contain"
                            />
                            <AvatarFallback className="text-[10px] bg-amber-500 text-white">
                              BTC
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">Bitcoin (BTC)</span>
                        </SelectItem>
                      )}
                      {stats?.platformFeeWallets?.LTC && (
                        <SelectItem value="LTC">
                          <Avatar className="size-5 bg-transparent p-0">
                            <AvatarImage
                              src={CRYPTO_LOGOS.LTC}
                              className="object-contain"
                            />
                            <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                              LTC
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">Litecoin (LTC)</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {generateError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-medium">
                    <AlertTriangle className="size-3.5" />
                    {generateError}
                  </div>
                )}

                <Button
                  className="w-full h-11 text-sm font-semibold shadow-sm"
                  disabled={!usdAmount || !selectedCurrency || isGenerating}
                  onClick={handleGeneratePayment}
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    "Generate Payment Details"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* QR Code Container */}
                <div className="mb-6 p-4 rounded-3xl bg-white border border-border shadow-xs dark:ring-4 dark:ring-white/10 mx-auto">
                  <QRCodeSVG
                    value={getWalletAddress(selectedCurrency) || ""}
                    size={180}
                    level={"H"}
                    includeMargin={false}
                    className="rounded-lg"
                    imageSettings={
                      selectedCurrency
                        ? {
                            src: CRYPTO_LOGOS[selectedCurrency as Currency],
                            height: 48,
                            width: 48,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                </div>

                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Amount Due
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                    {cryptoAmount?.toFixed(6)}
                  </span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {selectedCurrency.includes("_")
                      ? selectedCurrency.split("_")[0]
                      : selectedCurrency}
                  </span>
                </div>

                <div className="w-full space-y-4">
                  <div className="flex bg-muted/30 border border-border/40 p-1.5 rounded-xl">
                    <div className="flex-1 px-3 py-2 flex items-center overflow-hidden">
                      <code className="text-xs font-mono font-medium truncate text-muted-foreground">
                        {getWalletAddress(selectedCurrency)}
                      </code>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="shrink-0 h-8 rounded-lg"
                      onClick={() =>
                        copyAddress(
                          getWalletAddress(selectedCurrency)!,
                          "address",
                        )
                      }
                    >
                      {copiedField === "address" ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>

                  <div className="h-px bg-border/40 w-full" />

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Transaction Hash (Required)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste TxHash after sending"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className="h-10 text-xs font-mono shadow-none"
                        disabled={isClaiming || claimStatus?.success}
                      />
                      <Button
                        className="h-10 shrink-0"
                        onClick={submitClaim}
                        disabled={
                          !txHash ||
                          txHash.length < 10 ||
                          isClaiming ||
                          claimStatus?.success
                        }
                      >
                        {isClaiming ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    {claimStatus?.error && (
                      <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                        <AlertTriangle className="size-3 shrink-0" />
                        {claimStatus.error}
                      </p>
                    )}
                    {claimStatus?.success && (
                      <div className="flex items-center gap-1.5 p-2.5 mt-2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="size-4 shrink-0" />
                        <p className="text-sm font-medium">
                          {claimStatus.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* How It Works Section */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              How Billing Works
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            KnotEngine uses a prepaid credit system to keep your business
            running smoothly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Welcome Credit",
                description:
                  "Every new store starts with $5.00 in free credit — enough to process your first $500 in sales.",
                icon: Sparkles,
                color: "text-emerald-500",
              },
              {
                step: "02",
                title: "Auto-Deduction",
                description: `A ${(feeRate * 100).toFixed(1)}% fee is deducted from your credit for each confirmed payment. Your customers pay directly to your wallet.`,
                icon: Receipt,
                color: "text-blue-500",
              },
              {
                step: "03",
                title: "Top Up",
                description:
                  "When your credit runs low, send crypto to any platform wallet above. Credits are added instantly on confirmation.",
                icon: TrendingUp,
                color: "text-purple-500",
              },
              {
                step: "04",
                title: "Non-Custodial",
                description:
                  "We never touch your revenue. 100% of customer payments go to your wallet. Credits only cover platform fees.",
                icon: ShieldCheck,
                color: "text-amber-500",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col gap-2 p-4 rounded-xl border border-border/30 bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground/40">
                    {item.step}
                  </span>
                  <item.icon className={cn("size-3.5", item.color)} />
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
            <span>
              Zero-custody guarantee — KnotEngine never holds or routes your
              customer funds.
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
