"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  const router = useRouter();
  const { update } = useSession();

  // Data State
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    logoUrl: "",
    returnUrl: "",
    webhookUrl: "",
    webhookSecret: "",
  });

  // ──────────────────────────────────────────────
  // 2FA State
  // ──────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFASetupDialogOpen, setTwoFASetupDialogOpen] = useState(false);
  const [twoFADisableDialogOpen, setTwoFADisableDialogOpen] = useState(false);
  const [twoFASetupData, setTwoFASetupData] = useState<{
    secret: string;
    qrCode: string;
  } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setFormData({
        businessName: m.name || "",
        businessEmail: m.email || "",
        logoUrl: m.logoUrl || "",
        returnUrl: m.returnUrl || "",
        webhookUrl: m.webhookUrl || "",
        webhookSecret: m.webhookSecret || "",
      });
      setTwoFactorEnabled(m.twoFactorEnabled || false);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.patch("/v1/merchants/me", {
        name: formData.businessName,
        email: formData.businessEmail,
        logoUrl: formData.logoUrl,
        returnUrl: formData.returnUrl,
        webhookUrl: formData.webhookUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMerchant = async () => {
    setDeleting(true);
    try {
      await api.delete("/v1/merchants/me");
      await update();
      router.push("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete merchant", err);
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // ──────────────────────────────────────────────
  // 2FA Handlers
  // ──────────────────────────────────────────────
  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError("");
    setTwoFACode("");
    setBackupCodes([]);
    setShowBackupCodes(false);
    try {
      const res = await api.post("/v1/merchants/me/2fa/setup");
      setTwoFASetupData({
        secret: res.data.secret,
        qrCode: res.data.qrCode,
      });
      setTwoFASetupDialogOpen(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to start 2FA setup.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await api.post("/v1/merchants/me/2fa/enable", {
        code: twoFACode,
      });
      setBackupCodes(res.data.backupCodes || []);
      setShowBackupCodes(true);
      setTwoFactorEnabled(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid code. Please try again.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      await api.post("/v1/merchants/me/2fa/disable", { code: twoFACode });
      setTwoFactorEnabled(false);
      setTwoFADisableDialogOpen(false);
      setTwoFACode("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid code. Please try again.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with Save Action */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Merchant Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your merchant configuration and preferences.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg hover:shadow-primary/20 transition-all"
        >
          {saving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Save className="size-3" />
          )}
          {success ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Merchant Details + 2FA Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Merchant Details Card */}
          <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Merchant Details</CardTitle>
              <CardDescription>
                Your merchant&apos;s public identity and unique identifiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="merchantName">Merchant Name</Label>
                <Input
                  id="merchantName"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  placeholder="My Awesome Merchant"
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Merchant Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  placeholder="https://yourmerchant.com/logo.png"
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="returnUrl">Checkout Return URL</Label>
                <Input
                  id="returnUrl"
                  value={formData.returnUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, returnUrl: e.target.value })
                  }
                  placeholder="https://yourmerchant.com/checkout/success"
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* ──────────────────────────────────────────────
            🔐 Two-Factor Authentication Card
            ────────────────────────────────────────────── */}
          <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="size-5 text-primary" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Add an extra layer of security to your merchant account
                    using an authenticator app.
                  </CardDescription>
                </div>
                <Badge
                  variant={twoFactorEnabled ? "default" : "secondary"}
                  className={
                    twoFactorEnabled
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
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
              <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg bg-muted/10">
                <div>
                  <div className="font-bold text-sm">
                    {twoFactorEnabled
                      ? "Two-Factor Authentication is Active"
                      : "Protect Your Account"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                    {twoFactorEnabled
                      ? "Your account is secured with TOTP verification. A code is required for sensitive operations."
                      : "Enable 2FA to require an authenticator code when performing sensitive actions like changing wallet addresses or rotating API keys."}
                  </div>
                </div>

                {twoFactorEnabled ? (
                  <Dialog
                    open={twoFADisableDialogOpen}
                    onOpenChange={(open) => {
                      setTwoFADisableDialogOpen(open);
                      if (!open) {
                        setTwoFACode("");
                        setTwoFAError("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ShieldOff className="size-3" />
                        Disable 2FA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-5 text-amber-500" />
                          Disable Two-Factor Authentication
                        </DialogTitle>
                        <DialogDescription>
                          Enter your current authenticator code to confirm
                          disabling 2FA. This will reduce your account security.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="disable2faCode">
                            Authenticator Code
                          </Label>
                          <Input
                            id="disable2faCode"
                            value={twoFACode}
                            onChange={(e) =>
                              setTwoFACode(
                                e.target.value.replace(/\D/g, "").slice(0, 6),
                              )
                            }
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-2xl font-mono tracking-[0.5em] bg-background/50"
                            autoComplete="one-time-code"
                          />
                        </div>
                        {twoFAError && (
                          <p className="text-xs text-destructive font-medium">
                            {twoFAError}
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTwoFADisableDialogOpen(false);
                            setTwoFACode("");
                            setTwoFAError("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisable2FA}
                          disabled={twoFACode.length !== 6 || twoFALoading}
                        >
                          {twoFALoading && (
                            <Loader2 className="size-3 mr-2 animate-spin" />
                          )}
                          Disable 2FA
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog
                    open={twoFASetupDialogOpen}
                    onOpenChange={(open) => {
                      setTwoFASetupDialogOpen(open);
                      if (!open) {
                        setTwoFACode("");
                        setTwoFAError("");
                        setTwoFASetupData(null);
                        setShowBackupCodes(false);
                        setBackupCodes([]);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={handleSetup2FA}
                        disabled={twoFALoading}
                      >
                        {twoFALoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-3" />
                        )}
                        Enable 2FA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      {!showBackupCodes ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <ShieldCheck className="size-5 text-primary" />
                              Set Up Two-Factor Authentication
                            </DialogTitle>
                            <DialogDescription>
                              Scan the QR code below with your authenticator app
                              (Google Authenticator, Authy, etc.), then enter
                              the 6-digit code to verify.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {twoFASetupData?.qrCode && (
                              <div className="flex flex-col items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-inner">
                                  <img
                                    src={twoFASetupData.qrCode}
                                    alt="2FA QR Code"
                                    className="size-48"
                                  />
                                </div>
                                <div className="w-full">
                                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Manual Entry Key
                                  </Label>
                                  <div className="mt-1 flex items-center gap-2">
                                    <code className="flex-1 text-xs font-mono bg-muted/50 border border-border/50 rounded-md px-3 py-2 break-all">
                                      {twoFASetupData.secret}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 shrink-0"
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          twoFASetupData.secret,
                                        )
                                      }
                                    >
                                      <Copy className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="grid gap-2">
                              <Label htmlFor="setup2faCode">
                                Verification Code
                              </Label>
                              <Input
                                id="setup2faCode"
                                value={twoFACode}
                                onChange={(e) =>
                                  setTwoFACode(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 6),
                                  )
                                }
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl font-mono tracking-[0.5em] bg-background/50"
                                autoComplete="one-time-code"
                              />
                            </div>

                            {twoFAError && (
                              <p className="text-xs text-destructive font-medium">
                                {twoFAError}
                              </p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setTwoFASetupDialogOpen(false);
                                setTwoFACode("");
                                setTwoFAError("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleEnable2FA}
                              disabled={twoFACode.length !== 6 || twoFALoading}
                            >
                              {twoFALoading && (
                                <Loader2 className="size-3 mr-2 animate-spin" />
                              )}
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
                              Save these backup codes in a secure location. Each
                              code can only be used once as an alternative to
                              your authenticator app.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="grid grid-cols-1 gap-2">
                              {backupCodes.map((code, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-lg px-4 py-2.5"
                                >
                                  <code className="font-mono text-sm font-bold tracking-wider">
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
                                These codes will not be shown again. Save them
                                now.
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  backupCodes.join("\n"),
                                );
                              }}
                              className="gap-2"
                            >
                              <Copy className="size-3" />
                              Copy All
                            </Button>
                            <Button
                              onClick={() => {
                                setTwoFASetupDialogOpen(false);
                                setShowBackupCodes(false);
                                setBackupCodes([]);
                                setTwoFACode("");
                              }}
                            >
                              Done
                            </Button>
                          </DialogFooter>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5 shadow-none overflow-hidden">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Irreversible actions for this merchant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background/50">
              <div>
                <div className="font-bold text-sm">Delete Merchant</div>
                <div className="text-xs text-muted-foreground">
                  Permanently delete this merchant and all its data.
                </div>
              </div>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    <Trash2 className="size-3 mr-2" />
                    Delete Merchant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="size-5" />
                      Delete Merchant
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                      This action <strong>cannot</strong> be undone. This will
                      permanently delete the{" "}
                      <strong>
                        {formData.businessName || "Untitled Merchant"}
                      </strong>{" "}
                      merchant, invoices, webhook logs, and all associated
                      settings.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-2 py-4">
                    <Label
                      htmlFor="confirmName"
                      className="text-sm font-medium"
                    >
                      Please type{" "}
                      <strong>
                        {formData.businessName || "Untitled Merchant"}
                      </strong>{" "}
                      to confirm.
                    </Label>
                    <Input
                      id="confirmName"
                      value={deleteConfirmationName}
                      onChange={(e) =>
                        setDeleteConfirmationName(e.target.value)
                      }
                      placeholder="Type merchant name here..."
                      autoComplete="off"
                      className="col-span-3"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmationName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteMerchant}
                      disabled={
                        deleting ||
                        deleteConfirmationName !==
                          (formData.businessName || "Untitled Merchant")
                      }
                    >
                      {deleting ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 mr-2" />
                      )}
                      Delete Permanently
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Toast (Global) */}
      {success && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 z-50">
          <Alert className="bg-emerald-500 text-white border-none shadow-xl flex items-center gap-3 pr-8">
            <CheckCircle2 className="size-5" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">Changes Saved</span>
              <span className="text-[10px] opacity-90 font-medium">
                Your merchant settings have been updated.
              </span>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
