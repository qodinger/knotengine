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
    <Card className="bg-card/40 border-border/50 hover:bg-card/60 hover:border-primary/30 group shadow-sm backdrop-blur-md transition-all">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <KeyRound className="text-primary size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Add an extra layer of security to your merchant account.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-border/40 bg-muted/10 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">
                {twoFactorEnabled
                  ? "Two-Factor Authentication is Active"
                  : "Protect Your Account"}
              </div>
              <Badge
                variant={twoFactorEnabled ? "default" : "secondary"}
                className={
                  twoFactorEnabled
                    ? "border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500"
                    : "bg-muted text-muted-foreground px-1.5 py-0.5"
                }
              >
                {twoFactorEnabled ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium">
                    <ShieldCheck className="size-2.5" /> Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium">
                    <ShieldOff className="size-2.5" /> Disabled
                  </span>
                )}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-0.5 max-w-md text-xs">
              {twoFactorEnabled
                ? "Your account is secured with TOTP verification. A code is required for sensitive operations."
                : "Enable 2FA to require an authenticator code when performing sensitive actions like changing wallet addresses or rotating API keys."}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
