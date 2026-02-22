"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export function useWebhooks() {
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

  const handleSaveWebhooks = async (data?: any) => {
    setSavingWebhooks(true);
    setWebhookSuccess(false);
    try {
      const payload = data || {
        webhookUrl: webhookData.webhookUrl,
        webhookEvents: webhookData.webhookEvents,
      };
      await api.patch("/v1/merchants/me", payload);
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

  return {
    webhookData,
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
    fetchMerchantConfig,
  };
}
