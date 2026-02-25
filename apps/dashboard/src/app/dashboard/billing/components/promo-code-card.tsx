"use client";

import { useState } from "react";
import { Ticket, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import axios from "axios";
import { cn } from "@/lib/utils";

interface PromoCodeCardProps {
  onSuccess?: (addedUsd?: number) => void;
}

export function PromoCodeCard({ onSuccess }: PromoCodeCardProps) {
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
      onSuccess?.(res.data.addedUsd);
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
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Ticket className="text-primary size-4" />
          <CardTitle className="text-[10px] font-bold tracking-wider uppercase">
            Promo Code
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Enter a promo code to add credits to your balance instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setStatus(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            placeholder="e.g. PROMO_A1B2C3D4"
            className="font-mono text-sm tracking-wider"
            disabled={isLoading}
          />
          <Button
            onClick={handleRedeem}
            disabled={isLoading || !code.trim()}
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Redeem"}
          </Button>
        </div>

        {status && (
          <div
            className={cn(
              "mt-3 flex items-start gap-2 rounded-md p-3 text-sm",
              status.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            {status.type === "success" ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
