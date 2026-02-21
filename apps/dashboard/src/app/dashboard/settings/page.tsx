"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  Trash2,
  AlertTriangle,
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
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Testnet Generation State
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
  const [storeId, setStoreId] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    logoUrl: "",
    returnUrl: "",
    webhookUrl: "",
    webhookSecret: "",
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setStoreId(m.id || m._id || "unknown");
      setFormData({
        businessName: m.name || "",
        businessEmail: m.email || "",
        logoUrl: m.logoUrl || "",
        returnUrl: m.returnUrl || "",
        webhookUrl: m.webhookUrl || "",
        webhookSecret: m.webhookSecret || "",
      });
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

  const handleDeleteStore = async () => {
    setDeleting(true);
    try {
      await api.delete("/v1/merchants/me");
      // Re-fetch session — this triggers the jwt callback which re-reads the
      // merchants list from the DB. The remaining stores will be returned and
      // NextAuth will automatically select the first available one.
      await update();
      router.push("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete store", err);
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Save Action */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store configuration and preferences.
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
        {/* Store Details Card */}
        <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>
              Your store&apos;s public identity and unique identifiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                placeholder="My Awesome Store"
                className="bg-background/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logoUrl">Store Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://yourstore.com/logo.png"
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
                placeholder="https://yourstore.com/checkout/success"
                className="bg-background/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storeId">Store ID</Label>
              <div className="relative">
                <Input
                  id="storeId"
                  value={storeId}
                  readOnly
                  className="bg-muted/50 font-mono text-muted-foreground pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(storeId);
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 2000);
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Unique identifier used in API requests and support.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5 shadow-none overflow-hidden">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Irreversible actions for this store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background/50">
              <div>
                <div className="font-bold text-sm">Delete Store</div>
                <div className="text-xs text-muted-foreground">
                  Permanently delete this store and all its data.
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
                    Delete Store
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="size-5" />
                      Delete Store
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                      This action <strong>cannot</strong> be undone. This will
                      permanently delete the{" "}
                      <strong>
                        {formData.businessName || "Untitled Store"}
                      </strong>{" "}
                      store, invoices, webhook logs, and all associated
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
                        {formData.businessName || "Untitled Store"}
                      </strong>{" "}
                      to confirm.
                    </Label>
                    <Input
                      id="confirmName"
                      value={deleteConfirmationName}
                      onChange={(e) =>
                        setDeleteConfirmationName(e.target.value)
                      }
                      placeholder="Type store name here..."
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
                      onClick={handleDeleteStore}
                      disabled={
                        deleting ||
                        deleteConfirmationName !==
                          (formData.businessName || "Untitled Store")
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
                Your store settings have been updated.
              </span>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
