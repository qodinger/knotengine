"use client";

import {
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AffiliatesHeader } from "./components/affiliates-header";
import { cn } from "@/lib/utils";

export default function AffiliatesPage() {
  const { data: session, status } = useSession();
  const [copied, setCopied] = useState(false);

  const isLoading = status === "loading";

  // @ts-expect-error - Custom affiliate fields in session
  const affiliateCode = session?.user?.referralCode;
  // @ts-expect-error - Custom affiliate fields in session
  const affiliateEarningsUsd = session?.user?.referralEarningsUsd || 0;

  const affiliateLink = affiliateCode
    ? `https://knotengine.com/register?ref=${affiliateCode}`
    : "https://knotengine.com/register?ref=...";

  const copyToClipboard = () => {
    if (!affiliateCode) return;
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    totalAffiliates: 0,
    activeMerchants: 0,
    totalEarned: affiliateEarningsUsd,
    potentialEarnings: affiliateEarningsUsd * 2 || 100.0,
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <AffiliatesHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="group relative overflow-hidden border-emerald-500/10 bg-emerald-500/5">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black tracking-widest text-emerald-500/70 uppercase">
              Total Earned
            </CardDescription>
            <CardTitle className="px-0 text-4xl font-black tracking-tighter text-white">
              ${stats.totalEarned.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
              <TrendingUp className="size-3 text-emerald-500" />
              Paid to Credit Balance
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-white/5 bg-zinc-900/50">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black tracking-widest text-white/30 uppercase">
              Total Affiliates
            </CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter text-white">
              {stats.totalAffiliates}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {stats.activeMerchants} Active Merchants
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-white/5 bg-zinc-900/50">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black tracking-widest text-white/30 uppercase">
              Your Commission
            </CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter text-white">
              10%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Forever on all top-ups
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="relative flex flex-col overflow-hidden border-white/5 bg-[#050505] shadow-2xl">
          <div className="bg-primary/5 absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full blur-3xl" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 border-primary/20 rounded-lg border p-2">
                <Gift className="text-primary size-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Your Affiliate Link
                </CardTitle>
                <CardDescription className="text-xs">
                  Share this with other business owners.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative flex-1 space-y-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={
                    isLoading ? "Loading affiliate link..." : affiliateLink
                  }
                  className={cn(
                    "focus-visible:ring-primary/20 h-12! border-white/10 bg-black pr-24 text-sm font-medium text-white/70 transition-all",
                    isLoading && "animate-pulse",
                  )}
                />
                {!isLoading && affiliateCode && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded bg-white/5 px-2 py-1 font-mono text-[10px] text-white/20 select-none">
                    {affiliateCode}
                  </div>
                )}
              </div>
              <Button
                onClick={copyToClipboard}
                size="lg"
                disabled={isLoading || !affiliateCode}
                className={cn(
                  "h-12! px-8 text-xs font-black tracking-widest uppercase transition-all duration-300",
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-zinc-200",
                )}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/2 p-5 transition-colors hover:border-white/10">
                <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/90">
                    Transparent & Verified
                  </h4>
                  <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                    Every affiliate conversion is tracked and commission payouts
                    are logged in your balance history.
                  </p>
                </div>
              </div>
              <div className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/2 p-5 transition-colors hover:border-white/10">
                <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/90">
                    Instant Commission
                  </h4>
                  <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                    Your credit balance updates automatically the moment your
                    affiliate performs a top-up.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-white/5 bg-zinc-900/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">
              How the Affiliate Program Works
            </CardTitle>
            <CardDescription className="text-xs">
              A simple 3-step commission engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  text: "Share your unique affiliate link with a merchant or business owner.",
                },
                {
                  step: "2",
                  text: "They register under your link and perform a Stablecoin top-up.",
                },
                {
                  step: "3",
                  text: "You receive 10% of their deposit as credit — tracked forever.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-white/2"
                >
                  <div className="bg-primary/10 border-primary/20 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-black shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                    {item.step}
                  </div>
                  <p className="pt-1.5 text-xs leading-relaxed font-semibold text-white/60">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border-primary/10 group relative overflow-hidden rounded-2xl border p-6">
              <div className="from-primary/10 absolute inset-0 bg-linear-to-r to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <h4 className="text-primary mb-3 flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] uppercase">
                <Zap className="fill-primary size-3" />
                Commission Example
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed antialiased">
                If your affiliate tops up{" "}
                <span className="font-bold text-white">$1,000 USDT</span>, they
                receive their credits, and{" "}
                <span className="font-bold text-emerald-500">
                  you instantly receive $100
                </span>
                . Refer 10 merchants doing the same, and your processing fees
                stay free forever.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/5 pt-4">
            <Button
              variant="link"
              className="gap-2 px-0 text-[10px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-white"
            >
              View Affiliate Agreement <ArrowUpRight className="size-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
