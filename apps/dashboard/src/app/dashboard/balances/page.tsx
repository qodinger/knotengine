"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  ArrowLeftRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  SUPPORTED_CURRENCIES,
  Currency,
  CRYPTO_LOGOS,
  CRYPTO_LABELS,
} from "@knotengine/types";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface MerchantProfile {
  id: string;
  name: string;
  btcXpub: string | null;
  ethAddress: string | null;
}

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: string;
  created_at: string;
}

const generateSparklineData = (currencyInvoices: Invoice[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyVolume = last7Days.reduce(
    (acc, date) => {
      acc[date] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  currencyInvoices.forEach((inv) => {
    if (inv.status === "confirmed") {
      const date = new Date(inv.created_at).toISOString().split("T")[0];
      if (dailyVolume[date] !== undefined) {
        dailyVolume[date] += inv.amount_usd;
      }
    }
  });

  return Object.values(dailyVolume).map((val, i) => ({
    name: i.toString(),
    val: val === 0 ? Math.random() * 5 + 1 : val + Math.random() * 5, // Add tiny noise so sparkline isn't flat 0 if empty
  }));
};

export default function BalancesPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchPrices = async () => {
    const newPrices: Record<string, number> = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      try {
        const res = await api.get(`/v1/price/${currency}`);
        newPrices[currency] = res.data.price_usd;
      } catch {
        newPrices[currency] = 0; // Fallback
      }
    }
    setPrices(newPrices);
  };

  const fetchData = useCallback(async () => {
    try {
      const [merchantRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/invoices", { params: { limit: 1000 } }),
      ]);
      setMerchant(merchantRes.data);
      setInvoices(invoicesRes.data.data || []);
      await fetchPrices();
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

  const getBaseAddress = (currency: Currency) => {
    if (currency === "BTC" || currency === "LTC")
      return merchant?.btcXpub || null;
    return merchant?.ethAddress || null;
  };

  const truncate = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const calculateBalances = () => {
    let totalUsd = 0;
    const assets = SUPPORTED_CURRENCIES.map((currency) => {
      const currencyInvoices = invoices.filter(
        (inv) => inv.crypto_currency === currency,
      );

      const confirmedInvoices = currencyInvoices.filter(
        (inv) => inv.status === "confirmed",
      );
      const totalVolumeUsd = confirmedInvoices.reduce(
        (sum, inv) => sum + inv.amount_usd,
        0,
      );
      const totalVolumeCrypto = confirmedInvoices.reduce(
        (sum, inv) => sum + inv.crypto_amount,
        0,
      );

      totalUsd += totalVolumeUsd;

      return {
        currency,
        label: CRYPTO_LABELS[currency],
        logo: CRYPTO_LOGOS[currency],
        priceUsd: prices[currency] || 0,
        volumeUsd: totalVolumeUsd,
        volumeCrypto: totalVolumeCrypto,
        sparkline: generateSparklineData(currencyInvoices),
        baseAddress: getBaseAddress(currency),
      };
    });

    return { totalUsd, assets };
  };

  const { totalUsd, assets } = calculateBalances();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header aligned exactly like Plisio */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-extrabold text-[#747ea0] tracking-tight">
            My assets
          </h1>
          {loading ? (
            <span className="text-2xl font-bold text-[#a0a8c2] tracking-tight opacity-50">
              ... USD
            </span>
          ) : (
            <span className="text-2xl font-bold text-[#a0a8c2] tracking-tight">
              {totalUsd.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USD
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          className="bg-[#e4ebfc] text-[#4d5c8f] hover:bg-[#d4dcf5] font-bold px-6 h-10 shadow-none"
        >
          <Link href="/dashboard/settings">Edit Settings</Link>
        </Button>
      </div>

      {/* Main Asset Card Wrapper */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-[#0c0c0c] dark:shadow-none dark:border dark:border-border overflow-hidden">
        {assets.map((asset, index) => (
          <div
            key={asset.currency}
            className={cn(
              "p-6 flex flex-col gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5",
              index !== assets.length - 1 &&
                "border-b border-slate-100 dark:border-white/5",
            )}
          >
            <div className="flex items-center justify-between">
              {/* Asset Identity */}
              <div className="flex items-center gap-4 w-64 shrink-0">
                <img
                  src={asset.logo}
                  alt={asset.currency}
                  className="size-10 object-contain rounded-full bg-white shadow-sm ring-1 ring-slate-100 dark:ring-white/10"
                />
                <span className="font-extrabold text-[#747ea0] dark:text-slate-200 text-lg tracking-tight">
                  {asset.label.split(" ")[0]}{" "}
                  <span className="text-[#a0a8c2] text-sm font-semibold">
                    {asset.currency}
                  </span>
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center text-[#747ea0] dark:text-slate-400 font-semibold text-sm w-48 shrink-0">
                1 {asset.currency.split("_")[0]} ={" "}
                <span className="font-bold text-[#446df6] dark:text-blue-400 ml-1">
                  $
                  {asset.priceUsd.toLocaleString(undefined, {
                    maximumFractionDigits: asset.priceUsd < 1 ? 4 : 2,
                  })}
                </span>
              </div>

              {/* Sparkline */}
              <div className="h-10 w-32 shrink-0 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={asset.sparkline}>
                    <defs>
                      <linearGradient
                        id={`grad-${asset.currency}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#446df6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#446df6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke="#446df6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#grad-${asset.currency})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Balances */}
              <div className="flex flex-col items-end w-48 shrink-0">
                <span className="font-bold text-[#446df6] dark:text-blue-400 text-lg tracking-tight">
                  {asset.volumeCrypto > 0
                    ? asset.volumeCrypto.toFixed(8)
                    : "0.00"}{" "}
                  <span className="text-[#a0a8c2] text-xs uppercase ml-0.5">
                    {asset.currency}
                  </span>
                </span>
                <span className="font-bold text-[#a0a8c2] text-sm">
                  {asset.volumeUsd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USD
                </span>
              </div>
            </div>

            {/* Address Row & Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <code className="text-[13px] font-mono font-medium text-[#a0a8c2] dark:text-slate-400 pl-[56px]">
                  {asset.baseAddress
                    ? truncate(asset.baseAddress)
                    : "Not Configured"}
                </code>
                {asset.baseAddress && (
                  <button
                    onClick={() =>
                      copyAddress(asset.baseAddress!, asset.currency)
                    }
                    className="text-[#446df6] hover:text-[#3151b5] transition-colors p-1"
                  >
                    {copiedField === asset.currency ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Plisio style action buttons */}
              <div className="flex gap-2">
                <div className="flex items-center text-[#a0a8c2] font-extrabold text-[13px] mr-6">
                  {asset.volumeCrypto > 0
                    ? asset.volumeCrypto.toFixed(8)
                    : "0.00"}{" "}
                  {asset.currency}
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 bg-[#e4ebfc] text-[#446df6] hover:bg-[#d4dcf5] hover:text-[#446df6] rounded bg-opacity-70 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 bg-[#e4ebfc] text-[#446df6] hover:bg-[#d4dcf5] hover:text-[#446df6] rounded bg-opacity-70 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 bg-[#e4ebfc] text-[#446df6] hover:bg-[#d4dcf5] hover:text-[#446df6] rounded bg-opacity-70 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <ArrowLeftRight className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 bg-[#e4ebfc] text-[#446df6] hover:bg-[#d4dcf5] hover:text-[#446df6] rounded bg-opacity-70 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <FileText className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
