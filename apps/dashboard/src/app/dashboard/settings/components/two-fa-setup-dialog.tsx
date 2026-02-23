"use client";

import {
  ShieldCheck,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TwoFASetupData } from "../types";

interface TwoFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupData: TwoFASetupData | null;
  twoFACode: string;
  setTwoFACode: (code: string) => void;
  error: string;
  loading: boolean;
  onVerify: () => void;
  showBackupCodes: boolean;
  backupCodes: string[];
}

export function TwoFASetupDialog({
  open,
  onOpenChange,
  setupData,
  twoFACode,
  setTwoFACode,
  error,
  loading,
  onVerify,
  showBackupCodes,
  backupCodes,
}: TwoFASetupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/5 text-slate-50 sm:max-w-md">
        {!showBackupCodes ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary size-5" />
                Set Up Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Scan the QR code below with your authenticator app, then enter
                the 6-digit code to verify.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {setupData?.qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-xl bg-white p-3 shadow-inner">
                    <img
                      src={setupData.qrCode}
                      alt="2FA QR Code"
                      className="size-48"
                    />
                  </div>
                  <div className="w-full">
                    <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                      Manual Entry Key
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-muted/50 border-border/50 text-foreground flex-1 rounded-md border px-3 py-2 font-mono text-xs break-all">
                        {setupData.secret}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-8 shrink-0"
                        onClick={() =>
                          navigator.clipboard.writeText(setupData.secret)
                        }
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="setup2faCode">Verification Code</Label>
                <Input
                  id="setup2faCode"
                  value={twoFACode}
                  onChange={(e) =>
                    setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  className="bg-background/50 text-center font-mono text-2xl tracking-[0.5em]"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="text-destructive text-xs font-medium">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={onVerify}
                disabled={twoFACode.length !== 6 || loading}
              >
                {loading && <Loader2 className="mr-2 size-3 animate-spin" />}
                Verify & Enable
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="size-5" />
                2FA Enabled Successfully
              </DialogTitle>
              <DialogDescription>
                Save these backup codes in a secure location. Each code can only
                be used once.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-1 gap-2">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/30 border-border/40 flex items-center justify-between rounded-lg border px-4 py-2.5"
                  >
                    <code className="text-foreground font-mono text-sm font-bold tracking-wider">
                      {code}
                    </code>
                    <span className="text-muted-foreground text-[10px]">
                      {idx + 1} of {backupCodes.length}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  These codes will not be shown again. Save them now.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join("\n"));
                }}
                className="gap-2"
              >
                <Copy className="size-3" />
                Copy All
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
