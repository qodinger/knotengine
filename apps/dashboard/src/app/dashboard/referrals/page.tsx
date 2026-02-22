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
import { ReferralsHeader } from "./components/referrals-header";
import { cn } from "@/lib/utils";

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const [copied, setCopied] = useState(false);

  const isLoading = status === "loading";

  // @ts-expect-error - Custom referral fields in session
  const referralCode = session?.user?.referralCode;
  // @ts-expect-error - Custom referral fields in session
  const referralEarningsUsd = session?.user?.referralEarningsUsd || 0;

  const referralLink = referralCode
    ? `https://knotengine.com/register?ref=${referralCode}`
    : "https://knotengine.com/register?ref=...";

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    totalReferrals: 0,
    activeMerchants: 0,
    totalEarned: referralEarningsUsd,
    potentialEarnings: referralEarningsUsd * 2 || 100.0,
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <ReferralsHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] font-black tracking-widest text-emerald-500/70">
              Total Earned
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white px-0 tracking-tighter">
              ${stats.totalEarned.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="size-3 text-emerald-500" />
              Paid to Credit Balance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] font-black tracking-widest text-white/30">
              Total Referrals
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white tracking-tighter">
              {stats.totalReferrals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {stats.activeMerchants} Active Merchants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] font-black tracking-widest text-white/30">
              Your Commission
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white tracking-tighter">
              10%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Forever on all top-ups
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-white/5 bg-[#050505] shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Gift className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Your Referral Link
                </CardTitle>
                <CardDescription className="text-xs">
                  Share this with other business owners.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6 flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={isLoading ? "Loading referral link..." : referralLink}
                  className={cn(
                    "bg-black border-white/10 text-white/70 font-medium pr-24 h-12! text-sm focus-visible:ring-primary/20 transition-all",
                    isLoading && "animate-pulse",
                  )}
                />
                {!isLoading && referralCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/20 select-none bg-white/5 px-2 py-1 rounded">
                    {referralCode}
                  </div>
                )}
              </div>
              <Button
                onClick={copyToClipboard}
                size="lg"
                disabled={isLoading || !referralCode}
                className={cn(
                  "h-12! px-8 font-black text-xs uppercase tracking-widest transition-all duration-300",
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
              <div className="p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3 group">
                <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/90">
                    Safe & Transparent
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Every referral is tracked on-chain and payouts are visible
                    in your balance logs.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3 group">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/90">
                    Instant Payouts
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Your bonus balance updates automatically the millisecond
                    your referral tops up.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/20 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">
              How it works
            </CardTitle>
            <CardDescription className="text-xs">
              Simple 3-step growth engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  text: "Send your unique link to a merchant owner.",
                },
                {
                  step: "2",
                  text: "They register and perform a Stablecoin top-up.",
                },
                {
                  step: "3",
                  text: "You receive 10% of their total deposit amount.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/2 transition-colors"
                >
                  <div className="size-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                    {item.step}
                  </div>
                  <p className="text-xs font-semibold text-white/60 leading-relaxed pt-1.5">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="font-extrabold text-xs uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
                <Zap className="size-3 fill-primary" />
                Growth Example
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed antialiased">
                If your referral tops up{" "}
                <span className="text-white font-bold">$1,000 USDT</span>, they
                receive their credits, and{" "}
                <span className="text-emerald-500 font-bold">
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
              className="text-zinc-500 hover:text-white transition-colors gap-2 text-[10px] uppercase font-bold tracking-widest px-0"
            >
              View Affiliate Agreement <ArrowUpRight className="size-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
