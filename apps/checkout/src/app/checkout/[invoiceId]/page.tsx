"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckoutCard } from "@/components/CheckoutCard";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { Loader2, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import packageJson from "../../../../package.json";

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  useEffect(() => {
    if (!invoiceId) return;

    // 1. Initial Fetch
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/invoices/${invoiceId}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchInvoice();

    // 2. Socket.io for Real-time Updates
    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      console.log("⚡ Connected to Real-time Payment Engine");
      socket.emit("join_invoice", invoiceId);
    });

    socket.on(
      "status_update",
      (data: { status: string; confirmations: number; txHash: string }) => {
        console.log("📢 Status Update Received:", data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setInvoice((prev: any) => ({
          ...prev,
          status: data.status,
          confirmations: data.confirmations,
          tx_hash: data.txHash,
        }));
      },
    );

    // 3. Low-frequency fallback polling (every 30s)
    const interval = setInterval(fetchInvoice, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [invoiceId, API_BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <CyberpunkBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={40} className="text-neon-blue" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
        <CyberpunkBackground />
        <div className="p-8 glass rounded-3xl border-neon-pink/50 max-w-sm">
          <HelpCircle size={48} className="text-neon-pink mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2 tracking-tighter uppercase">
            Connection Error
          </h1>
          <p className="opacity-60 text-sm mb-6">
            {error}. Please verify the Invoice ID or contact the merchant.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 glass rounded-xl border-white/20 hover:border-white/40 transition-all font-bold text-xs uppercase"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <CyberpunkBackground />

      {/* Brand Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 flex items-center gap-2 group cursor-default"
      >
        <div className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-1">
          <span className="text-neon-purple group-hover:text-neon-blue transition-colors duration-500">
            Tye
          </span>
          <span className="opacity-80">Pay</span>
        </div>
        <div className="px-2 py-0.5 border border-white/10 rounded-md text-[8px] font-black tracking-widest uppercase opacity-40">
          v{packageJson.version}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {invoice.status === "confirmed" ? (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-8 glass rounded-3xl border-green-500/50 text-center"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={40} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">
              Payment Confirmed
            </h2>
            <p className="opacity-60 text-sm mb-8">
              Transaction has been verified on-chain. You may now close this
              window or return to the store.
            </p>
            <div className="text-[10px] font-mono opacity-30 truncate px-4 py-2 glass rounded-lg mb-8">
              TX: {invoice.tx_hash}
            </div>
            <button className="w-full py-4 bg-green-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-400 transition-all">
              Return to Store
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CheckoutCard invoice={invoice} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="mt-12 text-[10px] font-bold tracking-[0.3em] uppercase opacity-20 hover:opacity-100 transition-opacity duration-700 cursor-default">
        Powered by{" "}
        <span className="text-neon-blue">Tyecode Infrastructure</span>
      </footer>
    </main>
  );
}
