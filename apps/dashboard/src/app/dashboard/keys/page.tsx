"use client";

import { useState, useEffect, useCallback } from "react";
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
import { api, getAuthHeaders } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [currentKey, setCurrentKey] = useState("");
  const [, setLoading] = useState(true);

  const fetchKey = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me/keys", {
        headers: getAuthHeaders(),
      });
      setCurrentKey(res.data.key);
    } catch (err) {
      console.error("Failed to fetch key", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const apiKey =
      typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;
    if (apiKey) fetchKey();
    else setLoading(false);
  }, [fetchKey]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rotateKey = async () => {
    setRotating(true);
    try {
      const res = await api.post(
        "/v1/merchants/me/keys/rotate",
        {},
        { headers: getAuthHeaders() },
      );
      const newKey = res.data.key;
      localStorage.setItem("tp_api_key", newKey);
      setCurrentKey(newKey);
      window.location.reload(); // Refresh to update all hooks
    } catch (err) {
      console.error("Failed to rotate key", err);
    } finally {
      setRotating(false);
    }
  };

  const apiKey =
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Authenticate to manage API infrastructure.
            </CardDescription>
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
    <div className="max-w-4xl space-y-8">
      <Card className="border-none shadow-none bg-background/50 border overflow-hidden">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                Secret Access Key
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Last rotated: Never
              </span>
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
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Invalidate & Rotate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
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

function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={`${className} animate-spin`} />;
}
