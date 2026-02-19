"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutCardProps {
  invoice: {
    invoice_id: string;
    amount_usd: number;
    crypto_amount: number;
    crypto_currency: string;
    pay_address: string;
    status: string;
    expires_at: string;
    fee_usd: number;
    metadata?: {
      isTestnet?: boolean;
    };
  };
}

export function CheckoutCard({ invoice }: CheckoutCardProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [amountCopied, setAmountCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const expiry = new Date(invoice.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [invoice.expires_at]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice.pay_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(invoice.crypto_amount.toString());
    setAmountCopied(true);
    setTimeout(() => setAmountCopied(false), 2000);
  };

  const generatePaymentUri = () => {
    const currency = invoice.crypto_currency;
    const address = invoice.pay_address;
    const amount = invoice.crypto_amount;

    if (currency === "BTC") return `bitcoin:${address}?amount=${amount}`;
    if (currency === "LTC") return `litecoin:${address}?amount=${amount}`;

    return address;
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-2xl relative">
      {/* Testnet Banner */}
      {invoice.metadata?.isTestnet && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-1.5 px-4 flex items-center justify-center gap-2">
          <AlertCircle size={12} className="text-yellow-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
            Testnet Mode
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                invoice.status === "pending"
                  ? "bg-amber-500"
                  : invoice.status === "confirmed"
                    ? "bg-emerald-500"
                    : invoice.status === "expired"
                      ? "bg-destructive"
                      : "bg-muted-foreground",
              )}
            />
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
              {invoice.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border">
            <Clock size={12} />
            <span className="text-xs font-mono font-bold tracking-tight">
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Amount Section */}
        <div className="flex flex-col items-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Total Amount
          </p>
          <div
            className="group flex flex-col items-center cursor-pointer select-none"
            onClick={copyAmount}
          >
            <div className="flex items-center gap-2 relative">
              <h2
                className={cn(
                  "text-3xl font-bold tracking-tight transition-colors",
                  amountCopied ? "text-emerald-500" : "text-foreground",
                )}
              >
                {invoice.crypto_amount}
              </h2>
              <span className="text-lg font-medium text-muted-foreground">
                {invoice.crypto_currency}
              </span>

              {amountCopied && (
                <span className="absolute -right-8 top-1/2 -translate-y-1/2">
                  <Check size={16} className="text-emerald-500" />
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              ≈ ${invoice.amount_usd.toFixed(2)} USD
            </p>
            <span className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to copy amount
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl mx-auto shadow-sm">
            <QRCodeSVG value={generatePaymentUri()} size={180} level="H" />
          </div>

          {/* Address Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                <Wallet size={10} />
                Payment Address
              </label>
            </div>

            <div className="relative group">
              <div className="w-full bg-secondary border border-border rounded-lg py-3 pl-4 pr-12 font-mono text-xs text-secondary-foreground truncate transition-colors group-hover:border-primary/20">
                {invoice.pay_address}
              </div>
              <button
                onClick={copyToClipboard}
                className="absolute right-1 top-1 bottom-1 p-2 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-secondary/30 border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            <span>Non-Custodial</span>
          </div>
          <span>Includes Network Fee</span>
        </div>
      </div>
    </div>
  );
}
