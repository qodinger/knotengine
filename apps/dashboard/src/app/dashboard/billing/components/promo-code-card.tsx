"use client";

import { useState } from "react";
import { Ticket, CheckCircle, XCircle, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import axios from "axios";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PromoCodeCardProps {
  onSuccess?: (addedUsd?: number) => void;
}

export function PromoCodeCard({ onSuccess }: PromoCodeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
    addedUsd?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const res = await api.post("/v1/merchants/me/promo/redeem", {
        code: trimmed,
      });

      setStatus({
        type: "success",
        message: `Successfully added $${res.data.addedUsd.toFixed(2)} to your balance!`,
        addedUsd: res.data.addedUsd,
      });
      setCode("");
      setTimeout(() => {
        onSuccess?.(res.data.addedUsd);
        setIsOpen(false);
      }, 1500);
    } catch (err: unknown) {
      let message = "Failed to redeem code. Please try again.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || message;
      }
      setStatus({ type: "error", message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="trigger"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
            >
              <Ticket className="mr-2 size-3.5" />
              Have a promo code?
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background/40 border-border/40 w-full max-w-md overflow-hidden rounded-xl border p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="text-primary size-3.5" />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Redeem Credits
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setStatus(null);
                  setCode("");
                }}
                className="size-6 rounded-full"
                disabled={isLoading}
              >
                <X className="size-3" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setStatus(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                placeholder="e.g. PROMO_2024"
                className="h-9 font-mono text-sm tracking-widest"
                disabled={isLoading}
                autoFocus
              />
              <Button
                onClick={handleRedeem}
                disabled={
                  isLoading || !code.trim() || status?.type === "success"
                }
                className="h-9 shrink-0 px-4"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>

            {status && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={cn(
                  "mt-3 flex items-start gap-2 rounded-lg p-3 text-xs leading-tight",
                  status.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400",
                )}
              >
                {status.type === "success" ? (
                  <CheckCircle className="size-3.5 shrink-0" />
                ) : (
                  <XCircle className="size-3.5 shrink-0" />
                )}
                <span>{status.message}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
