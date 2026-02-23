"use client";

import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TwoFactorCardProps {
  twoFactorEnabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
  loading: boolean;
}

export function TwoFactorCard({
  twoFactorEnabled,
  onEnable,
  onDisable,
  loading,
}: TwoFactorCardProps) {
  return (
    <Card className="from-card to-card/50 border-border/50 bg-linear-to-br shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="text-primary size-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="mt-1">
              Add an extra layer of security to your merchant account using an
              authenticator app.
            </CardDescription>
          </div>
          <Badge
            variant={twoFactorEnabled ? "default" : "secondary"}
            className={
              twoFactorEnabled
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }
          >
            {twoFactorEnabled ? (
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3" /> Enabled
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShieldOff className="size-3" /> Disabled
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-border/40 bg-muted/10 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <div className="text-sm font-bold">
              {twoFactorEnabled
                ? "Two-Factor Authentication is Active"
                : "Protect Your Account"}
            </div>
            <div className="text-muted-foreground mt-0.5 max-w-md text-xs">
              {twoFactorEnabled
                ? "Your account is secured with TOTP verification. A code is required for sensitive operations."
                : "Enable 2FA to require an authenticator code when performing sensitive actions like changing wallet addresses or rotating API keys."}
            </div>
          </div>

          <Button
            variant={twoFactorEnabled ? "outline" : "default"}
            size="sm"
            className="gap-2"
            onClick={twoFactorEnabled ? onDisable : onEnable}
            disabled={loading}
          >
            {twoFactorEnabled ? (
              <>
                <ShieldOff className="size-3" />
                Disable 2FA
              </>
            ) : (
              <>
                <ShieldCheck className="size-3" />
                Enable 2FA
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
