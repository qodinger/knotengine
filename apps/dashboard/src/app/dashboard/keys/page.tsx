"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Check,
  AlertTriangle,
  Code,
  ShieldCheck,
  Zap,
  KeyRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const INTERNAL_SECRET = process.env.NEXT_PUBLIC_INTERNAL_SECRET || "";

export default function ApiKeysPage() {
  const { data: session, update: updateSession } = useSession();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(
    null,
  );

  const currentKey = newlyGeneratedKey || session?.user?.apiKey || "";
  const hasKey = !!currentKey;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/merchants/me/keys/generate`, {
        method: "POST",
        headers: {
          "x-oauth-id": session?.user?.oauthId || "",
          "x-internal-secret": INTERNAL_SECRET,
        },
      });

      if (!res.ok) throw new Error("Failed to generate key");
      const data = await res.json();
      setNewlyGeneratedKey(data.apiKey);
      // Update the session so the key persists
      await updateSession({ apiKey: data.apiKey });
    } catch (err) {
      console.error("Failed to generate key:", err);
    } finally {
      setGenerating(false);
    }
  };

  const rotateKey = async () => {
    setRotating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/merchants/me/keys`, {
        method: "POST",
        headers: {
          "x-api-key": currentKey,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to rotate key");
      const data = await res.json();
      setNewlyGeneratedKey(data.apiKey);
      await updateSession({ apiKey: data.apiKey });
    } catch (err) {
      console.error("Failed to rotate key:", err);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <Card className="border-none shadow-none bg-background/50 border overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <ShieldCheck className="size-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Security Layer
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            API Infrastructure
          </CardTitle>
          <CardDescription>
            Manage your merchant credentials and endpoint access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 mt-2">
          {!hasKey ? (
            /* No key yet — prompt to generate */
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="size-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">No API Key Yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Generate your secret API key to start integrating KnotEngine
                  into your backend.
                </p>
              </div>
              <Button
                id="generate-api-key"
                onClick={generateKey}
                disabled={generating}
                className="gap-2"
              >
                {generating ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Generate API Key
              </Button>
            </div>
          ) : (
            /* Key exists — show it */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Secret Access Key
                </label>
                {newlyGeneratedKey && (
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                    ✓ Newly generated — copy now
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={currentKey}
                    readOnly
                    className="font-mono text-xs pr-20 bg-muted/30 border-none transition-all group-hover:bg-muted/50"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={copyToClipboard}
                  className="gap-2 font-bold uppercase text-[10px] tracking-wider"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          <Alert
            variant="destructive"
            className="bg-destructive/10 border-destructive/20 text-destructive"
          >
            <AlertTriangle className="size-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">
              Danger Zone
            </AlertTitle>
            <AlertDescription className="text-xs font-medium opacity-90">
              Never share your secret key or commit it to version control. If
              compromised, rotate it immediately.
            </AlertDescription>
          </Alert>
        </CardContent>

        {hasKey && (
          <CardFooter className="bg-muted/30 border-t py-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20"
                >
                  <RefreshCw className="size-3" />
                  Rotate Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-rose-500">
                    <RefreshCw className="size-5" />
                    Confirm Key Rotation
                  </DialogTitle>
                  <DialogDescription className="py-2">
                    Rotating your API key will{" "}
                    <span className="text-foreground font-bold underline decoration-rose-500/50">
                      immediately invalidate
                    </span>{" "}
                    the current one. All active integrations will stop working
                    until updated.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="secondary" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={rotateKey}
                    disabled={rotating}
                    className="gap-2"
                  >
                    {rotating ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Invalidate & Rotate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Code className="size-4 text-primary" />
              Direct Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-[10px] text-slate-400 overflow-x-auto border border-white/5">
              <span className="text-pink-400">curl</span> -X POST {API_BASE_URL}
              /v1/invoices \<br />
              &nbsp;&nbsp;-H{" "}
              <span className="text-emerald-400">
                &quot;x-api-key: YOUR_KEY&quot;
              </span>{" "}
              \
              <br />
              &nbsp;&nbsp;-d{" "}
              <span className="text-emerald-400">
                &apos;{'{ "amount_usd": 100, "currency": "BTC" }'}&apos;
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-xs text-muted-foreground font-medium">
              <li className="flex gap-2">
                <Zap className="size-3 mt-0.5 text-primary shrink-0" />
                Rotate keys every 90 days for maximum security.
              </li>
              <li className="flex gap-2">
                <Zap className="size-3 mt-0.5 text-primary shrink-0" />
                Use environment variables for secret storage.
              </li>
              <li className="flex gap-2">
                <Zap className="size-3 mt-0.5 text-primary shrink-0" />
                Implement IP whitelisting in your firewall.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
