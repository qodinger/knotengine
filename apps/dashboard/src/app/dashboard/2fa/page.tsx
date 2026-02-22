"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

export default function TwoFactorChallengePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { update } = useSession();
  const router = useRouter();

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/v1/merchants/me/2fa/validate", { code });

      if (res.data.valid) {
        // Mark 2FA as verified in the session (works for both TOTP and backup codes)
        await update({ twoFactorVerified: true });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid code. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length >= 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="size-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-sm">
            Enter the 6-digit code from your authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="twoFactorCode" className="sr-only">
              Authentication Code
            </Label>
            <Input
              id="twoFactorCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={8}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              onKeyDown={handleKeyDown}
              className="text-center text-3xl font-mono tracking-[0.75em] h-14 bg-muted/30"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground text-center">
              You can also use a backup code.
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium text-center bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <Button
            onClick={handleVerify}
            disabled={code.length < 6 || loading}
            className="w-full h-11 font-bold uppercase text-[11px] tracking-widest gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Verify
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
