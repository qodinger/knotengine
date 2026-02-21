"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Loader2,
  Send,
  Save,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, dedent } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeBlock } from "@/components/ui/code-block";

export function WebhooksTab() {
  const [copied, setCopied] = useState<string | null>(null);
  const [savingWebhooks, setSavingWebhooks] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [rotatingWebhookSecret, setRotatingWebhookSecret] = useState(false);
  const [webhookData, setWebhookData] = useState({
    webhookUrl: "",
    webhookSecret: "",
    webhookEvents: [] as string[],
  });
  const [selectedLanguage, setSelectedLanguage] = useState("nodejs-sdk");

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchMerchantConfig = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setWebhookData({
        webhookUrl: m.webhookUrl || "",
        webhookSecret: m.webhookSecret || "",
        webhookEvents: m.webhookEvents || [
          "invoice.confirmed",
          "invoice.mempool_detected",
          "invoice.failed",
        ],
      });
    } catch (err) {
      console.error("Failed to load merchant config", err);
    }
  }, []);

  useEffect(() => {
    fetchMerchantConfig();
  }, [fetchMerchantConfig]);

  const handleSaveWebhooks = async () => {
    setSavingWebhooks(true);
    setWebhookSuccess(false);
    try {
      await api.patch("/v1/merchants/me", {
        webhookUrl: webhookData.webhookUrl,
        webhookEvents: webhookData.webhookEvents,
      });
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSavingWebhooks(false);
    }
  };

  const handleRotateWebhookSecret = async () => {
    setRotatingWebhookSecret(true);
    try {
      const res = await api.post("/v1/merchants/me/keys/webhook", {});
      setWebhookData((prev) => ({
        ...prev,
        webhookSecret: res.data.webhookSecret,
      }));
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to rotate webhook secret", err);
    } finally {
      setRotatingWebhookSecret(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      await api.post("/v1/merchants/me/webhooks/test", {});
    } catch (err) {
      console.error("Failed to test webhook", err);
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Endpoint Configuration</h3>
          <p className="text-xs text-muted-foreground">
            Set the URL where KnotEngine will send POST requests when events
            occur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1.5"
            onClick={handleTestWebhook}
            disabled={!webhookData.webhookUrl || testingWebhook}
          >
            {testingWebhook ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            Test
          </Button>
          <Button
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1.5"
            onClick={handleSaveWebhooks}
            disabled={savingWebhooks}
          >
            {savingWebhooks ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            {webhookSuccess ? "Saved" : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="space-y-6 pt-6 pb-6">
          <div className="grid gap-2">
            <Label
              htmlFor="webhookUrl"
              className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
            >
              Endpoint URL
            </Label>
            <Input
              id="webhookUrl"
              value={webhookData.webhookUrl}
              onChange={(e) =>
                setWebhookData({
                  ...webhookData,
                  webhookUrl: e.target.value,
                })
              }
              placeholder="https://api.myapp.com/webhooks"
              className="bg-background/50 font-mono text-xs focus-visible:ring-emerald-500/30"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="secret"
                className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
              >
                Signing Secret
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateWebhookSecret}
                disabled={rotatingWebhookSecret}
                className="h-6 text-[9px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                {rotatingWebhookSecret ? "Rotating..." : "Rotate Secret"}
              </Button>
            </div>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="secret"
                  type={showWebhookSecret ? "text" : "password"}
                  value={webhookData.webhookSecret}
                  readOnly
                  className="bg-background/50 font-mono text-xs pr-16 focus-visible:ring-0"
                  placeholder="knot_wh_********************"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full text-[10px] uppercase font-bold tracking-wider hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  disabled={!webhookData.webhookSecret}
                >
                  {showWebhookSecret ? "Hide" : "Reveal"}
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() =>
                  copyToClipboard(webhookData.webhookSecret, "secret")
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

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-600">
                Security Policy
              </span>
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-relaxed">
              Always verify the{" "}
              <code className="text-emerald-600 font-mono">
                x-knot-signature
              </code>{" "}
              header using your secret before processing webhooks to ensure the
              source is authentic.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-sm font-semibold">
            Event Subscriptions
          </CardTitle>
          <CardDescription className="text-xs">
            Select the specific events you want to receive notifications for.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {[
              {
                id: "e-confirmed",
                key: "invoice.confirmed",
                desc: "Fired when an invoice reaches required confirmations.",
              },
              {
                id: "e-mempool",
                key: "invoice.mempool_detected",
                desc: "Fired immediately when a transaction is seen in mempool.",
              },
              {
                id: "e-failed",
                key: "invoice.failed",
                desc: "Fired when an invoice expires or remains unpaid.",
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all group"
              >
                <Checkbox
                  id={item.id}
                  checked={webhookData.webhookEvents.includes(item.key)}
                  onCheckedChange={(checked) => {
                    const events = webhookData.webhookEvents;
                    if (checked) {
                      setWebhookData({
                        ...webhookData,
                        webhookEvents: [...events, item.key],
                      });
                    } else {
                      setWebhookData({
                        ...webhookData,
                        webhookEvents: events.filter((e) => e !== item.key),
                      });
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label
                    htmlFor={item.id}
                    className="text-xs font-bold cursor-pointer group-hover:text-primary transition-colors"
                  >
                    {item.key}
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Developer Documentation Section */}
      <div className="flex flex-col gap-6 mt-6 items-start w-full">
        {/* Payload Preview */}
        <Card className="border shadow-sm bg-[#0c0c0c] text-slate-50 relative overflow-hidden w-full">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-50">
                  Payload preview
                </h3>
                <p className="text-xs text-slate-400">
                  Sample HTTP request structure sent to your server.
                </p>
              </div>
              <CodeBlock
                language="json"
                className="w-full h-[400px]"
                code={dedent`
                  POST /webhooks HTTP/1.1
                  x-knot-signature: 8f...2a
                  x-knot-event: invoice.confirmed
                  Content-Type: application/json

                  {
                    "id": "evt_test_1234567890",
                    "event": "invoice.confirmed",
                    "created": 1700000000,
                    "invoice_id": "inv_test_1234567890",
                    "status": "confirmed",
                    "amount": {
                      "usd": 100.0,
                      "crypto": 0.0015,
                      "currency": "BTC",
                      "fee_usd": 1.0
                    },
                    "payment": {
                      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
                      "tx_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                      "confirmations": 2,
                      "paid_at": "2024-02-21T01:52:45.000Z"
                    },
                    "metadata": {
                      "is_test": true
                    }
                  }
                `}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Guide */}
      {/* Implementation Guide */}
      <Card className="border shadow-sm mt-6 bg-[#0c0c0c] text-slate-50 relative overflow-hidden">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-10">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-50">
                  Implementation Guide
                </h3>
                <p className="text-xs text-slate-400">
                  A quick reference for verifying webhook signatures.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-50">
                    Signature verification
                  </h4>
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
                  Webhooks are signed with a{" "}
                  <code className="text-slate-300 bg-white/5 px-1 py-0.5 rounded text-xs select-none relative z-10 mx-1">
                    HMAC-SHA256
                  </code>{" "}
                  hash of the raw request body using your signing secret. We
                  recommend using a timing-safe comparison to prevent
                  side-channel attacks.
                </p>
                <div className="flex pt-2">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-slate-300 hover:text-white"
                    asChild
                  >
                    <a href="#">
                      View docs <ExternalLink className="ml-1.5 size-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setSelectedLanguage("nodejs-sdk")}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
                      selectedLanguage === "nodejs-sdk"
                        ? "bg-[#0A0A0A] text-slate-100 shadow-sm border border-white/5"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    Node.js SDK
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("nodejs")}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
                      selectedLanguage === "nodejs"
                        ? "bg-[#0A0A0A] text-slate-100 shadow-sm border border-white/5"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    Node.js
                  </button>
                </div>
              </div>

              <CodeBlock
                className="h-[400px]"
                language="typescript"
                code={
                  selectedLanguage === "nodejs-sdk"
                    ? dedent`
                        import { KnotEngine } from '@tyecode/knotengine-sdk';

                        const knot = new KnotEngine({
                          apiKey: process.env.KNOT_API_KEY,
                          webhookSecret: process.env.KNOT_WEBHOOK_SECRET
                        });

                        // 1. Get signature from headers
                        const signature = req.headers['x-knot-signature'];

                        // 2. Verify automatically via SDK
                        const isValid = knot.verifyWebhook(req.rawBody, signature);
                      `
                    : dedent`
                        import crypto from 'crypto';

                        // 1. Get signature & raw body
                        const signature = req.headers['x-knot-signature'];
                        const rawBody = req.rawBody; // Required for HMAC!

                        // 2. Generate expected HMAC-SHA256 signature
                        const expected = crypto
                          .createHmac('sha256', process.env.KNOT_WEBHOOK_SECRET)
                          .update(rawBody)
                          .digest('hex');

                        // 3. Timing-safe comparison to prevent side-channel attacks
                        const sigBuf = Buffer.from(signature, 'hex');
                        const expBuf = Buffer.from(expected, 'hex');

                        let isValid = false;
                        if (sigBuf.length === expBuf.length) {
                          isValid = crypto.timingSafeEqual(sigBuf, expBuf);
                        }
                      `
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
