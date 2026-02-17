"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

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
  };
}

export function CheckoutCard({ invoice }: CheckoutCardProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

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

  const generatePaymentUri = () => {
    const currency = invoice.crypto_currency;
    const address = invoice.pay_address;
    const amount = invoice.crypto_amount;

    if (currency === "BTC") return `bitcoin:${address}?amount=${amount}`;
    if (currency === "LTC") return `litecoin:${address}?amount=${amount}`;

    // For ERC-20/Tokens, raw address is often the safest for broad compatibility
    // unless EIP-681 is strictly required by the specific wallet.
    return address;
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-1 bg-linear-to-br from-neon-purple/20 via-neon-blue/20 to-neon-pink/20 rounded-3xl">
      <div className="glass rounded-[22px] p-8 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-blue rounded-full animate-pulse" />
            <span className="text-sm font-medium tracking-widest uppercase opacity-60">
              Status: {invoice.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neon-pink">
            <Clock size={16} />
            <span className="text-sm font-mono font-bold tracking-tighter">
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Amount Section */}
        <div
          className="text-center mb-8 group cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(invoice.crypto_amount.toString());
            // Optional: Add a toast or visual feedback here if you want to extend the 'copied' state logic
            const original = document.getElementById("amount-text");
            if (original) {
              original.innerText = "COPIED!";
              setTimeout(() => {
                original.innerText = invoice.crypto_amount.toString();
              }, 1000);
            }
          }}
        >
          <h2 className="text-5xl font-black mb-2 tracking-tighter hover:scale-105 transition-transform flex items-center justify-center gap-2">
            <span id="amount-text">{invoice.crypto_amount}</span>
            <span className="text-2xl font-medium opacity-50 group-hover:text-neon-blue transition-colors">
              {invoice.crypto_currency}
            </span>
            <Copy
              size={20}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-blue"
            />
          </h2>
          <p className="text-lg opacity-40 font-medium">
            ≈ ${invoice.amount_usd.toFixed(2)} USD
          </p>
        </div>

        {/* QR Code */}
        <div className="relative p-4 bg-white rounded-2xl mb-8 group overflow-hidden border-4 border-transparent hover:neon-border transition-all duration-500">
          <QRCodeSVG
            value={generatePaymentUri()}
            size={220}
            level="H"
            bgColor="#ffffff"
            fgColor="#000000"
          />
          {/* Scanning Animation Overlay */}
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-neon-blue/40 shadow-[0_0_10px_#00f2ff]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Address Input */}
        <div className="w-full mb-8">
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-2 ml-1">
            Payment Address
          </label>
          <div className="relative flex items-center">
            <input
              readOnly
              value={invoice.pay_address}
              className="w-full glass border-white/5 bg-white/5 rounded-xl py-4 pl-5 pr-12 text-xs font-mono truncate focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="absolute right-2 p-2 hover:text-neon-blue transition-colors"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="w-full space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs opacity-60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>Non-Custodial Payment</span>
            </div>
            <span>Fee included: ${invoice.fee_usd.toFixed(2)}</span>
          </div>

          <div className="flex items-start gap-2 text-[10px] opacity-40 leading-relaxed italic">
            <AlertCircle size={10} className="mt-0.5 shrink-0" />
            <p>
              Please send exact amount to avoid payment recognition issues.
              Expired invoices will result in lost funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
