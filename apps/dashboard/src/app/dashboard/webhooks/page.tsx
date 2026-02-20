"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Loader2,
  Save,
  Copy,
  Check,
  Webhook,
  Code,
  ShieldCheck,
  Terminal,
  RefreshCcw,
  Send,
  ExternalLink,
  Zap,
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
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { dedent } from "@/lib/utils";

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState({
    webhookUrl: "",
    webhookSecret: "",
    webhookEvents: [] as string[],
  });

  const [showSecret, setShowSecret] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setFormData({
        webhookUrl: m.webhookUrl || "",
        webhookSecret: m.webhookSecret || "",
        webhookEvents: m.webhookEvents || [
          "invoice.confirmed",
          "invoice.mempool_detected",
          "invoice.failed",
        ],
      });
    } catch (err) {
      console.error("Failed to load config", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.patch("/v1/merchants/me", {
        webhookUrl: formData.webhookUrl,
        webhookEvents: formData.webhookEvents,
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

  const handleTestWebhook = async () => {
    setTesting(true);
    try {
      await api.post("/v1/merchants/me/webhooks/test", {});
    } catch (err) {
      console.error("Failed to test webhook", err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-end justify-between pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure real-time event notifications for your integration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 gap-2 font-medium"
            onClick={handleTestWebhook}
            disabled={!formData.webhookUrl || testing}
          >
            {testing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Test webhook
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            size="sm"
            className="h-9 px-4 gap-2 font-medium"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {success && formData.webhookUrl !== ""
              ? "Changes saved"
              : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Main Endpoint Config */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-xl font-bold tracking-tight">
              Endpoint configuration
            </CardTitle>
            <CardDescription>
              Set the URL where KnotEngine will send POST requests when events
              occur on your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <div className="grid gap-2">
              <Label htmlFor="webhookUrl" className="text-xs">
                Endpoint URL
              </Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, webhookUrl: e.target.value })
                }
                placeholder="https://api.myapp.com/webhooks"
                className="bg-background/50 font-mono text-xs focus-visible:ring-emerald-500/30"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="secret" className="text-xs">
                  Signing Secret
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateSecret}
                  disabled={rotatingSecret || loading}
                  className="h-6 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {rotatingSecret ? "Rotating..." : "Rotate Secret"}
                </Button>
              </div>
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="secret"
                    type={showSecret ? "text" : "password"}
                    value={formData.webhookSecret}
                    readOnly
                    className="bg-background/50 font-mono text-xs pr-16 focus-visible:ring-0"
                    placeholder={
                      loading ? "Loading..." : "knot_wh_********************"
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full text-xs hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecret(!showSecret)}
                    disabled={!formData.webhookSecret}
                  >
                    {showSecret ? "Hide" : "Reveal"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    copyToClipboard(formData.webhookSecret, "secret")
                  }
                >
                  {copied === "secret" ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-slate-950 text-slate-50 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-tight text-slate-200">
                  Security Note
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Always verify the{" "}
                <code className="text-emerald-400/80 font-mono">
                  x-knot-signature
                </code>{" "}
                header using your secret before processing webhooks to ensure
                the source is authentic.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event Subscriptions */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-xl font-bold tracking-tight">
              Event subscriptions
            </CardTitle>
            <CardDescription>
              Select the specific events you want to receive notifications for.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: "e-confirmed",
                  key: "invoice.confirmed",
                  desc: "Fired when an invoice reaches the required number of block confirmations and is fully settled.",
                },
                {
                  id: "e-mempool",
                  key: "invoice.mempool_detected",
                  desc: "Fired immediately when a transaction is broadcasted to the network, before any block confirmations (0-conf).",
                },
                {
                  id: "e-failed",
                  key: "invoice.failed",
                  desc: "Fired when an invoice expires or is fundamentally underpaid.",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all group"
                >
                  <Checkbox
                    id={item.id}
                    checked={formData.webhookEvents.includes(item.key)}
                    onCheckedChange={(checked) => {
                      const events = formData.webhookEvents;
                      if (checked) {
                        setFormData({
                          ...formData,
                          webhookEvents: [...events, item.key],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          webhookEvents: events.filter((e) => e !== item.key),
                        });
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="grid gap-1 leading-none">
                    <Label
                      htmlFor={item.id}
                      className="text-xs font-bold cursor-pointer group-hover:text-primary transition-colors"
                    >
                      {item.key}
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer Documentation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How Webhooks Work */}
          <Card className="border shadow-sm bg-slate-950 text-slate-50 relative overflow-hidden">
            <CardHeader className="pb-8">
              <div className="flex items-center gap-2">
                <RefreshCcw className="size-5 text-emerald-400" />
                <CardTitle className="text-lg text-slate-50 font-bold">
                  How webhooks work
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Webhooks are &quot;push notifications&quot; for your backend
                system.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 pt-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative">
                {/* Connector Line */}
                <div className="hidden md:block absolute top-7 left-12 right-12 h-px bg-slate-800 z-0">
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 size-1.5 rounded-full bg-emerald-500/30" />
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 size-1.5 rounded-full bg-emerald-500/30" />
                </div>

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center space-y-4 relative z-10 w-full md:w-1/3 group">
                  <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Zap className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                      1. Trigger
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                      A transaction is detected or an invoice settles.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center space-y-4 relative z-10 w-full md:w-1/3 group">
                  <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Webhook className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                      2. POST
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                      We instantly send a POST request with the JSON data.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center space-y-4 relative z-10 w-full md:w-1/3 group">
                  <div className="size-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                      3. Verify
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                      Your server validates the signature and updates order
                      status.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payload Preview */}
          <Card className="border shadow-sm bg-slate-950 text-slate-50 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="size-5 text-emerald-400" />
                  <CardTitle className="text-lg text-slate-50 font-bold">
                    Payload preview
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-slate-400 hover:text-slate-100 gap-1.5"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          id: "evt_3f2...2a",
                          event: "invoice.confirmed",
                          status: "confirmed",
                        },
                        null,
                        2,
                      ),
                      "payload",
                    )
                  }
                >
                  <Copy className="size-3" />
                  {copied === "payload" ? "Copied" : "Copy JSON"}
                </Button>
              </div>
              <CardDescription className="text-slate-400">
                Sample HTTP request structure sent to your server.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-white/5">
              <div className="bg-slate-900/50 font-mono text-[10px] overflow-x-auto relative group p-6 max-h-[300px]">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                      Headers
                    </p>
                    <div className="text-slate-300">
                      <span className="text-purple-400">POST</span>{" "}
                      <span className="text-yellow-200">/webhooks</span>
                      <br />
                      <span className="text-emerald-400">x-knot-signature</span>
                      : 8f...2a
                      <br />
                      <span className="text-emerald-400">x-knot-event</span>:
                      invoice.confirmed
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                      Body
                    </p>
                    <div className="text-slate-300">
                      <span className="text-pink-400">{"{"}</span>
                      <br />
                      &nbsp;&nbsp;
                      <span className="text-emerald-400">
                        &quot;id&quot;
                      </span>:{" "}
                      <span className="text-yellow-300">
                        &quot;evt_3f2...2a&quot;
                      </span>
                      ,
                      <br />
                      &nbsp;&nbsp;
                      <span className="text-emerald-400">
                        &quot;event&quot;
                      </span>
                      :{" "}
                      <span className="text-yellow-300">
                        &quot;invoice.confirmed&quot;
                      </span>
                      ,
                      <br />
                      &nbsp;&nbsp;
                      <span className="text-emerald-400">
                        &quot;status&quot;
                      </span>
                      :{" "}
                      <span className="text-yellow-300">
                        &quot;confirmed&quot;
                      </span>
                      <br />
                      <span className="text-pink-400">{"}"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Guide */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-xl font-bold tracking-tight">
              Implementation Guide
            </CardTitle>
            <CardDescription>
              A quick reference for verifying webhook signatures.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-bold">Signature verification</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Webhooks are signed with a <code>HMAC-SHA256</code> hash of
                  the raw request body using your signing secret. We recommend
                  using a timing-safe comparison to prevent side-channel
                  attacks.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-primary"
                    asChild
                  >
                    <a href="#">
                      View docs <ExternalLink className="ml-1 size-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-tight">
                      Node.js Example
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1.5"
                    onClick={() =>
                      copyToClipboard(
                        dedent`
                          // 1. Get signature from headers
                          const signature = req.headers['x-knot-signature'];

                          // 2. Generate expected signature
                          const crypto = require('crypto');
                          const hmac = crypto.createHmac('sha256', secret);
                          hmac.update(rawBody);
                          const expected = hmac.digest('hex');
                          
                          // 3. Timing-safe comparison
                          const isValid = crypto.timingSafeEqual(
                            Buffer.from(signature),
                            Buffer.from(expected)
                          );
                        `,
                        "code",
                      )
                    }
                  >
                    <Copy className="size-3" />
                    {copied === "code" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] overflow-x-auto border border-white/5">
                  <div className="text-slate-300 leading-relaxed">
                    <span className="text-slate-500">
                      {"// 1. Get signature from headers"}
                    </span>
                    <br />
                    <span className="text-purple-400">const</span> signature =
                    req.headers[
                    <span className="text-yellow-200">
                      &apos;x-knot-signature&apos;
                    </span>
                    ];
                    <br />
                    <br />
                    <span className="text-slate-500">
                      {"// 2. Generate expected signature"}
                    </span>
                    <br />
                    <span className="text-purple-400">const</span> crypto ={" "}
                    <span className="text-purple-400">require</span>(
                    <span className="text-yellow-200">&apos;crypto&apos;</span>
                    );
                    <br />
                    <span className="text-purple-400">const</span> hmac =
                    crypto.<span className="text-blue-400">createHmac</span>(
                    <span className="text-yellow-200">&apos;sha256&apos;</span>,
                    secret);
                    <br />
                    hmac.<span className="text-blue-400">update</span>(rawBody);
                    <br />
                    <span className="text-purple-400">const</span> expected =
                    hmac.<span className="text-blue-400">digest</span>(
                    <span className="text-yellow-200">&apos;hex&apos;</span>);
                    <br />
                    <br />
                    <br />
                    <span className="text-slate-500">
                      {"// 3. Timing-safe comparison"}
                    </span>
                    <br />
                    <span className="text-purple-400">const</span> isValid =
                    crypto.
                    <span className="text-blue-400">timingSafeEqual</span>(
                    <br />
                    &nbsp;&nbsp;Buffer.
                    <span className="text-blue-400">from</span>(signature),
                    <br />
                    &nbsp;&nbsp;Buffer.
                    <span className="text-blue-400">from</span>(expected)
                    <br />
                    );
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 z-50">
          <Alert className="bg-emerald-500 text-white border-none shadow-xl flex items-center gap-3 pr-8">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Changes Saved</span>
              <span className="text-[10px] opacity-90 font-medium">
                Your webhook settings have been successfully updated.
              </span>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
