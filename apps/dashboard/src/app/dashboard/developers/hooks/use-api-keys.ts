"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

export function useApiKeys() {
  const { data: session, update: updateSession } = useSession();
  const [copied, setCopied] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [selectedIntegrationLanguage, setSelectedIntegrationLanguage] =
    useState("nodejs");

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      const res = await api.post("/v1/merchants/me/keys");
      await updateSession({ apiKey: res.data.apiKey });
      setNewKey(res.data.apiKey);
      setIsRotateDialogOpen(false);
    } catch (err) {
      console.error("Failed to rotate key:", err);
    } finally {
      setRotating(false);
    }
  };

  return {
    session,
    copied,
    rotating,
    isRotateDialogOpen,
    setIsRotateDialogOpen,
    newKey,
    setNewKey,
    selectedIntegrationLanguage,
    setSelectedIntegrationLanguage,
    copyToClipboard,
    handleRotateKey,
  };
}
