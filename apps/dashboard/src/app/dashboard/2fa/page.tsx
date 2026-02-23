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
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="border-border/50 w-full max-w-sm shadow-2xl">
        <CardHeader className="pb-2 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <KeyRound className="text-primary size-8" />
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
              className="bg-muted/30 h-14 text-center font-mono text-3xl tracking-[0.75em]"
              autoFocus
            />
            <p className="text-muted-foreground text-center text-[10px]">
              You can also use a backup code.
            </p>
          </div>

          {error && (
            <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center text-xs font-medium">
              {error}
            </p>
          )}

          <Button
            onClick={handleVerify}
            disabled={code.length < 6 || loading}
            className="h-11 w-full gap-2 text-[11px] font-bold tracking-widest uppercase"
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
