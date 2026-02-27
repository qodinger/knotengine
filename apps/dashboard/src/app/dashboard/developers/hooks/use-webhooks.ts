"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { fetcher, swrKeys } from "@/lib/swr";

interface MerchantResponse {
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];
  [key: string]: unknown;
}

export function useWebhooks() {
  const [copied, setCopied] = useState<string | null>(null);
  const [savingWebhooks, setSavingWebhooks] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [rotatingWebhookSecret, setRotatingWebhookSecret] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("nodejs-sdk");

  const { data: merchantData, mutate: mutateMerchant } =
    useSWR<MerchantResponse>(swrKeys.merchant, fetcher, {
      revalidateOnFocus: false,
    });

  const webhookData = {
    webhookUrl: merchantData?.webhookUrl || "",
    webhookSecret: merchantData?.webhookSecret || "",
    webhookEvents: merchantData?.webhookEvents || [
      "invoice.confirmed",
      "invoice.mempool_detected",
      "invoice.failed",
    ],
  };

  // Local state for form edits (so typing doesn't trigger SWR re-renders)
  const [localWebhookData, setLocalWebhookData] = useState<{
    webhookUrl: string;
    webhookSecret: string;
    webhookEvents: string[];
  } | null>(null);

  // Use local edits if available, otherwise use SWR data
  const activeWebhookData = localWebhookData ?? webhookData;

  const setWebhookData = (
    updater:
      | typeof activeWebhookData
      | ((prev: typeof activeWebhookData) => typeof activeWebhookData),
  ) => {
    if (typeof updater === "function") {
      setLocalWebhookData((prev) => updater(prev ?? webhookData));
    } else {
      setLocalWebhookData(updater);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveWebhooks = async (data?: Record<string, unknown>) => {
    setSavingWebhooks(true);
    setWebhookSuccess(false);
    try {
      const payload = data || {
        webhookUrl: activeWebhookData.webhookUrl,
        webhookEvents: activeWebhookData.webhookEvents,
      };
      await api.patch("/v1/merchants/me", payload);
      setLocalWebhookData(null); // Clear local edits, SWR will have fresh data
      await mutateMerchant();
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
      await api.post("/v1/merchants/me/keys/webhook", {});
      await mutateMerchant();
      setLocalWebhookData(null);
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

  return {
    webhookData: activeWebhookData,
    setWebhookData,
    copied,
    savingWebhooks,
    webhookSuccess,
    testingWebhook,
    showWebhookSecret,
    setShowWebhookSecret,
    rotatingWebhookSecret,
    selectedLanguage,
    setSelectedLanguage,
    copyToClipboard,
    handleSaveWebhooks,
    handleRotateWebhookSecret,
    handleTestWebhook,
    fetchMerchantConfig: mutateMerchant,
  };
}
