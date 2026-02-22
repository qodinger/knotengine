"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Key, FlaskConical, Webhook, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ApiKeysTab } from "./components/api-keys-tab";
import { TestnetTab } from "./components/testnet-tab";
import { WebhooksTab } from "./components/webhooks-tab";

function DevelopersContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "api-keys";

  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  const user = session?.user as
    | {
        publicMerchantId?: string;
        merchantId?: string;
      }
    | undefined;
  const displayMerchantId = user?.publicMerchantId || user?.merchantId || "";

  const copyMerchantId = () => {
    if (!displayMerchantId) return;
    navigator.clipboard.writeText(displayMerchantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync state if URL changes organically (e.g. user hits back button)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `?tab=${value}`);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            API keys, testing tools, and integration resources.
          </p>
        </div>

        {displayMerchantId && (
          <div className="flex justify-end flex-col gap-1 shrink-0 sm:w-80">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Merchant ID
            </Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={displayMerchantId}
                className="bg-muted/30 font-mono text-xs h-9"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={copyMerchantId}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="bg-muted/30 h-9 w-auto">
          <TabsTrigger
            value="api-keys"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <Key className="size-3" />
            API Keys
          </TabsTrigger>

          <TabsTrigger
            value="testnet"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <FlaskConical className="size-3" />
            Simulator
          </TabsTrigger>
          <TabsTrigger
            value="webhooks"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <Webhook className="size-3" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6 space-y-6">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="testnet" className="mt-6 space-y-6">
          <TestnetTab />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <WebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <DevelopersContent />
    </Suspense>
  );
}
