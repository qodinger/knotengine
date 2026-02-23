"use client";

import React, { useState, useEffect } from "react";
import { CheckoutCard } from "@/components/CheckoutCard";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { Invoice } from "@/types/invoice";

interface CheckoutPageClientProps {
  invoiceId: string;
  initialInvoice: Invoice | null;
}

export default function CheckoutPageClient({
  invoiceId,
  initialInvoice,
}: CheckoutPageClientProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(initialInvoice);
  const [loading, setLoading] = useState(!initialInvoice);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const fetchInvoice = React.useCallback(
    async (isManualRetry = false) => {
      if (isManualRetry) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(`${API_BASE_URL}/v1/invoices/${invoiceId}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
        setError(null);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    },
    [invoiceId, API_BASE_URL],
  );

  useEffect(() => {
    if (!invoiceId) return;

    if (!initialInvoice) {
      fetchInvoice();
    }

    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      socket.emit("join_invoice", invoiceId);
    });

    socket.on(
      "status_update",
      (data: {
        status: string;
        confirmations: number;
        txHash: string;
        cryptoAmountReceived?: number;
      }) => {
        setInvoice((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            confirmations: data.confirmations,
            tx_hash: data.txHash,
            crypto_amount_received:
              data.cryptoAmountReceived ?? prev.crypto_amount_received,
          };
        });
        // If we get a socket update, the connection is clearly working
        setError(null);
      },
    );

    const interval = setInterval(() => fetchInvoice(false), 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [invoiceId, API_BASE_URL, initialInvoice, fetchInvoice]);

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

  const handleRetry = () => {
    fetchInvoice(true);
  };

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
            onClick={handleRetry}
            className="w-full px-4 py-2.5 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {["confirmed", "overpaid"].includes(invoice.status) ? (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-card border border-border rounded-xl p-8 pb-4 text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">
                {invoice.status === "overpaid"
                  ? "Overpayment Confirmed"
                  : "Payment Confirmed"}
              </h2>

              {invoice.description && (
                <div className="mb-6 px-4 py-2.5 bg-muted/20 border border-border/40 rounded-lg inline-block mx-auto">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    “{invoice.description}”
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Transaction has been verified on-chain. You may now close this
                  window
                  {invoice.merchant?.return_url
                    ? " or return to the merchant."
                    : "."}
                </p>

                {invoice.status === "overpaid" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-left">
                    <p className="text-xs font-medium text-amber-500 mb-1">
                      Overpayment Detected
                    </p>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                      We detected that you sent more than the required amount.
                      Please contact{" "}
                      <span className="text-amber-500 font-bold">
                        {invoice.merchant?.name || "the merchant"}
                      </span>{" "}
                      regarding your overpayment of{" "}
                      <span className="text-amber-500 font-bold">
                        {parseFloat(
                          (
                            (invoice.crypto_amount_received || 0) -
                            invoice.crypto_amount
                          ).toFixed(8),
                        )}{" "}
                        {invoice.crypto_currency}
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-6 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Transaction Hash
                </span>
                <div className="bg-secondary/50 border border-border rounded-lg p-2 flex items-center justify-center">
                  <code className="text-[11px] font-mono text-foreground break-all">
                    {invoice.tx_hash ? (
                      invoice.tx_hash
                    ) : invoice.status === "confirmed" ||
                      invoice.status === "overpaid" ? (
                      <span className="text-muted-foreground font-sans">
                        Manual Resolution
                      </span>
                    ) : (
                      <span className="text-muted-foreground animate-pulse font-sans">
                        Processing...
                      </span>
                    )}
                  </code>
                </div>
              </div>

              {invoice.merchant?.return_url && (
                <button
                  onClick={() => {
                    const returnUrl = invoice.merchant?.return_url;
                    if (!returnUrl) return;
                    let url = returnUrl;
                    if (
                      !url.startsWith("http://") &&
                      !url.startsWith("https://") &&
                      !url.startsWith("/")
                    ) {
                      url = `https://${url}`;
                    }
                    window.location.href = url;
                  }}
                  className="w-full py-3 mb-4 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Return to {invoice.merchant?.name || "Merchant"}
                </button>
              )}
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
