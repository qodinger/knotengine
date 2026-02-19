"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  Trash2,
  AlertTriangle,
  Wand2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
// Testnet Generation State
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Data State
  const [storeId, setStoreId] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    xPub: "",
    xPubTestnet: "",
    ethAddress: "",
    ethAddressTestnet: "",
    confirmationPolicy: 1,
    webhookUrl: "",
    webhookSecret: "",
  });

  const [showSecret, setShowSecret] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);

  // Testnet Generation State
  const [generatingTestnet, setGeneratingTestnet] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setStoreId(m.id || m._id || "unknown");
      setFormData({
        businessName: m.name || "",
        businessEmail: m.email || "",
        xPub: m.btcXpub || "",
        xPubTestnet: m.btcXpubTestnet || "",
        ethAddress: m.ethAddress || "",
        ethAddressTestnet: m.ethAddressTestnet || "",
        confirmationPolicy: m.confirmationPolicy?.BTC || 1, // Assuming BTC policy roughly equates to general policy for now, or just use default
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
        btcXpub: formData.xPub,
        btcXpubTestnet: formData.xPubTestnet,
        ethAddress: formData.ethAddress,
        ethAddressTestnet: formData.ethAddressTestnet,
        // confirmationPolicy is complex object in backend, strictly typing it here
        confirmationPolicy: {
          BTC: formData.confirmationPolicy,
          LTC: 6,
          ETH: 12,
        },
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

  const handleRotateSecret = async () => {
    setRotatingSecret(true);
    try {
      const res = await api.post("/v1/merchants/me/keys/webhook", {});
      setFormData((prev) => ({
        ...prev,
        webhookSecret: res.data.webhookSecret,
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to rotate webhook secret", err);
    } finally {
      setRotatingSecret(false);
    }
  };

  const handleGenerateTestnet = async () => {
    setGeneratingTestnet(true);
    try {
      const res = await api.post(
        "/v1/merchants/me/wallet/generate-testnet",
        {},
      );
      // setTestnetMnemonic(res.data.mnemonic); // No longer showing mnemonic
      setFormData((prev) => ({
        ...prev,
        xPubTestnet: res.data.btcXpubTestnet,
        ethAddressTestnet: res.data.ethAddressTestnet,
      }));
      // setOpenDialog(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate testnet wallet", err);
    } finally {
      setGeneratingTestnet(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="general"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="developers"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Developers
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="general"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Trash2 className="size-3 mr-2" />
                  Delete Store
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="developers"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Wallet Config */}
          <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Wallet Configuration</CardTitle>
              <CardDescription>
                Set up your settlement wallets for mainnet and testnet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mainnet Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <h3 className="text-sm font-semibold text-foreground">
                    Mainnet
                  </h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    Live
                  </span>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="xpub">Bitcoin xPub</Label>
                  <Input
                    id="xpub"
                    value={formData.xPub}
                    onChange={(e) =>
                      setFormData({ ...formData, xPub: e.target.value })
                    }
                    placeholder="xpub..."
                    className="font-mono text-xs bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eth">Ethereum Address</Label>
                  <Input
                    id="eth"
                    value={formData.ethAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, ethAddress: e.target.value })
                    }
                    placeholder="0x..."
                    className="font-mono text-xs bg-background/50"
                  />
                </div>
              </div>

              {/* Testnet Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Testnet
                    </h3>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Test
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-2"
                    onClick={handleGenerateTestnet}
                    disabled={generatingTestnet}
                  >
                    {generatingTestnet ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Wand2 className="size-3" />
                    )}
                    Generate Wallet
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="xpubTest">Testnet Bitcoin xPub</Label>
                  <Input
                    id="xpubTest"
                    value={formData.xPubTestnet}
                    onChange={(e) =>
                      setFormData({ ...formData, xPubTestnet: e.target.value })
                    }
                    // Testnet xPubs often start with vpub or tpub, but user can enter anything
                    placeholder="vpub... or tpub..."
                    className="font-mono text-xs bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ethTest">Sepolia Ethereum Address</Label>
                  <Input
                    id="ethTest"
                    value={formData.ethAddressTestnet}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ethAddressTestnet: e.target.value,
                      })
                    }
                    placeholder="0x..."
                    className="font-mono text-xs bg-background/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure real-time event notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="webhookUrl">Endpoint URL</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                  placeholder="https://api.myapp.com/webhooks"
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="secret">Signing Secret</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRotateSecret}
                    disabled={rotatingSecret}
                    className="h-6 text-[10px] text-destructive"
                  >
                    {rotatingSecret ? "Rotating..." : "Rotate Secret"}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="secret"
                    type={showSecret ? "text" : "password"}
                    value={formData.webhookSecret}
                    readOnly
                    className="bg-background/50 font-mono pr-16"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
