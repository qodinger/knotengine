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
      <DialogContent className="sm:max-w-md text-slate-50 border-white/5">
        {!showBackupCodes ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
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
                  <div className="p-3 bg-white rounded-xl shadow-inner">
                    <img
                      src={setupData.qrCode}
                      alt="2FA QR Code"
                      className="size-48"
                    />
                  </div>
                  <div className="w-full">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Manual Entry Key
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-muted/50 border border-border/50 rounded-md px-3 py-2 break-all text-foreground">
                        {setupData.secret}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground"
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
                  className="text-center text-2xl font-mono tracking-[0.5em] bg-background/50"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
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
                {loading && <Loader2 className="size-3 mr-2 animate-spin" />}
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
                    className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-lg px-4 py-2.5"
                  >
                    <code className="font-mono text-sm font-bold tracking-wider text-foreground">
                      {code}
                    </code>
                    <span className="text-[10px] text-muted-foreground">
                      {idx + 1} of {backupCodes.length}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
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
