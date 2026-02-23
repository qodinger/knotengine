"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
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

interface TwoFADisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  twoFACode: string;
  setTwoFACode: (code: string) => void;
  error: string;
  loading: boolean;
  onDisable: () => void;
}

export function TwoFADisableDialog({
  open,
  onOpenChange,
  twoFACode,
  setTwoFACode,
  error,
  loading,
  onDisable,
}: TwoFADisableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter your current authenticator code to confirm disabling 2FA. This
            will reduce your account security.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="disable2faCode">Authenticator Code</Label>
            <Input
              id="disable2faCode"
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
            variant="destructive"
            onClick={onDisable}
            disabled={twoFACode.length !== 6 || loading}
          >
            {loading && <Loader2 className="mr-2 size-3 animate-spin" />}
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
