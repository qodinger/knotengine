"use client";

import React, { useState, useEffect } from "react";
import { CheckoutCard } from "@/components/CheckoutCard";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

interface CheckoutPageClientProps {
  invoiceId: string;
  initialInvoice: any;
}

export default function CheckoutPageClient({
  invoiceId,
  initialInvoice,
}: CheckoutPageClientProps) {
  const [invoice, setInvoice] = useState<any>(initialInvoice);
  const [loading, setLoading] = useState(!initialInvoice);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  useEffect(() => {
    if (!invoiceId) return;

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

    if (!initialInvoice) {
      fetchInvoice();
    }

    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      socket.emit("join_invoice", invoiceId);
    });

    socket.on(
      "status_update",
      (data: { status: string; confirmations: number; txHash: string }) => {
        setInvoice((prev: any) => ({
          ...prev,
          status: data.status,
          confirmations: data.confirmations,
          tx_hash: data.txHash,
        }));
      },
    );

    const interval = setInterval(fetchInvoice, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [invoiceId, API_BASE_URL, initialInvoice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={32} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
        <div className="p-8 bg-card rounded-xl border border-border max-w-sm shadow-2xl">
          <h1 className="text-xl font-bold mb-2 tracking-tight">
            Connection Error
          </h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {error}. Please verify the Invoice ID or contact the merchant.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2.5 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {invoice.status === "confirmed" ? (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-card border border-border rounded-xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">
                Payment Confirmed
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Transaction has been verified on-chain. You may now close this
                window or return to the merchant.
              </p>

              <div className="flex flex-col gap-1 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Transaction Hash
                </span>
                <div className="bg-secondary/50 border border-border rounded-lg px-3 py-2">
                  <code className="text-[10px] font-mono text-foreground break-all">
                    {invoice.tx_hash || "Processing..."}
                  </code>
                </div>
              </div>

              <button
                onClick={() => {
                  if (invoice.merchant?.return_url) {
                    window.location.href = invoice.merchant.return_url;
                  }
                }}
                className={`w-full py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors text-sm ${!invoice.merchant?.return_url ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!invoice.merchant?.return_url}
              >
                Return to {invoice.merchant?.name || "Merchant"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <CheckoutCard invoice={invoice} />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-8 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            <ShieldCheck size={12} />
            <span>Secured by</span>
            <span className="text-foreground font-bold">KnotEngine</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
