"use client";

import { useSearchParams } from "next/navigation";
import { Key, FlaskConical, Webhook, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ApiKeysTab } from "./components/api-keys-tab";
import { TestnetTab } from "./components/testnet-tab";
import { WebhooksTab } from "./components/webhooks-tab";
import { EventsTab } from "./components/events-tab";

export default function DevelopersPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "api-keys";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          API keys, testing tools, and integration resources.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
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
          <TabsTrigger
            value="events"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <Activity className="size-3" />
            Events
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

        <TabsContent value="events" className="mt-6 space-y-4">
          <EventsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
