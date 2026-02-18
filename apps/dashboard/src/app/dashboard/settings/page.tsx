"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  Info,
  Globe,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, getAuthHeaders } from "@/lib/api";

export default function SettingsPage() {
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    xPub: "",
    ethAddress: "",
    confirmationPolicy: 1,
    webhookUrl: "",
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me", {
        headers: getAuthHeaders(),
      });
      const m = res.data;
      setFormData({
        businessName: m.name || "",
        businessEmail: m.email || "",
        xPub: m.wallet_config?.bitcoin?.xpub || "",
        ethAddress: m.wallet_config?.ethereum?.address || "",
        confirmationPolicy: m.rules?.confirmation_policy || 1,
        webhookUrl: m.webhook_url || "",
      });
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const apiKey =
      typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;
    if (apiKey) fetchSettings();
    else setLoading(false);
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.patch(
        "/v1/merchants/me",
        {
          name: formData.businessName,
          email: formData.businessEmail,
          wallet_config: {
            bitcoin: { xpub: formData.xPub },
            ethereum: { address: formData.ethAddress },
          },
          rules: { confirmation_policy: formData.confirmationPolicy },
          webhook_url: formData.webhookUrl,
        },
        { headers: getAuthHeaders() },
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const apiKey =
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Session Required</CardTitle>
            <CardDescription>Authenticate to access settings.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Authenticate
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings2 className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Organization Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your business profile and infrastructure rules.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="font-bold uppercase text-[10px] tracking-widest gap-2"
        >
          {saving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Save className="size-3" />
          )}
          {success ? "Changes Saved" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="general"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="wallets"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Wallets
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Rules
          </TabsTrigger>
          <TabsTrigger
            value="webhooks"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="border-none shadow-none bg-background/50 border">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Business Profile
              </CardTitle>
              <CardDescription>
                Public identity for invoices and customer interactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Business Name
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="bg-muted/30 border-none transition-all hover:bg-muted/50"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="billing@acme.com"
                  value={formData.businessEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, businessEmail: e.target.value })
                  }
                  className="bg-muted/30 border-none transition-all hover:bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <Card className="border-none shadow-none bg-background/50 border">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Settlement Endpoints
              </CardTitle>
              <CardDescription>
                Where your funds will be delivered upon payment confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="xpub"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Bitcoin xPub
                </Label>
                <Input
                  id="xpub"
                  placeholder="vpub... or xpub..."
                  value={formData.xPub}
                  onChange={(e) =>
                    setFormData({ ...formData, xPub: e.target.value })
                  }
                  className="font-mono text-xs bg-muted/30 border-none"
                />
                <p className="text-[10px] text-muted-foreground flex gap-1.5 items-center">
                  <Info className="size-3" />
                  Used for generating unique deposit addresses per customer.
                </p>
              </div>
              <div className="grid gap-2 pt-2">
                <Label
                  htmlFor="eth"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Ethereum Address
                </Label>
                <Input
                  id="eth"
                  placeholder="0x..."
                  value={formData.ethAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ethAddress: e.target.value })
                  }
                  className="font-mono text-xs bg-muted/30 border-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="border-none shadow-none bg-background/50 border">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Payment Validation
              </CardTitle>
              <CardDescription>
                Configure the security parameters for incoming transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="conf"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Confirmation Threshold
                </Label>
                <Input
                  id="conf"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.confirmationPolicy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmationPolicy: parseInt(e.target.value),
                    })
                  }
                  className="w-24 bg-muted/30 border-none font-bold"
                />
                <p className="text-[10px] text-muted-foreground">
                  Number of blockchain confirmations required to mark an invoice
                  as &quot;Paid&quot;.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="border-none shadow-none bg-background/50 border">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Event Notifications
              </CardTitle>
              <CardDescription>
                Configure real-time listeners for payment lifecycle events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="webhook"
                  className="text-xs font-bold uppercase tracking-tight text-muted-foreground"
                >
                  Webhook URL
                </Label>
                <Input
                  id="webhook"
                  placeholder="https://api.yoursite.com/webhooks/tyepay"
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                  className="bg-muted/30 border-none"
                />
              </div>
              <Alert className="bg-primary/5 border-primary/10">
                <Globe className="size-4 text-primary" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                  Public Endpoint
                </AlertTitle>
                <AlertDescription className="text-xs font-medium text-muted-foreground">
                  Your server must respond with a{" "}
                  <code className="text-foreground">200 OK</code> to acknowledge
                  receipt.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {success && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4">
          <Alert className="bg-emerald-500 text-white border-none shadow-xl flex items-center gap-3 pr-8">
            <CheckCircle2 className="size-5" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">System Updated</span>
              <span className="text-[10px] opacity-90 font-medium">
                Settings synchronized with cloud infrastructure.
              </span>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
