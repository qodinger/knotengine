"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MerchantSettings, TwoFASetupData } from "../types";

export function useSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  const router = useRouter();
  const { update } = useSession();

  const [formData, setFormData] = useState<MerchantSettings>({
    merchantId: "",
    businessName: "",
    businessEmail: "",
    logoUrl: "",
    returnUrl: "",
    webhookUrl: "",
    webhookSecret: "",
    feeResponsibility: "merchant",
    invoiceExpirationMinutes: 60,
    underpaymentTolerancePercentage: 1,
    bip21Enabled: true,
    enabledCurrencies: [],
    spreadEnabled: true,
    customSpreadRate: undefined,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFASetupDialogOpen, setTwoFASetupDialogOpen] = useState(false);
  const [twoFADisableDialogOpen, setTwoFADisableDialogOpen] = useState(false);
  const [twoFASetupData, setTwoFASetupData] = useState<TwoFASetupData | null>(
    null,
  );
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me");
      const m = res.data;
      setFormData({
        merchantId: m.merchantId || m._id || "",
        businessName: m.name || "",
        businessEmail: m.email || "",
        logoUrl: m.logoUrl || "",
        returnUrl: m.returnUrl || "",
        webhookUrl: m.webhookUrl || "",
        webhookSecret: m.webhookSecret || "",
        feeResponsibility: m.feeResponsibility || "client",
        invoiceExpirationMinutes: m.invoiceExpirationMinutes || 60,
        underpaymentTolerancePercentage: m.underpaymentTolerancePercentage || 0,
        bip21Enabled: m.bip21Enabled ?? true,
        enabledCurrencies: m.enabledCurrencies || [],
        spreadEnabled: m.spreadEnabled ?? true,
        customSpreadRate: m.customSpreadRate,
      });
      setTwoFactorEnabled(m.twoFactorEnabled || false);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (newData?: MerchantSettings) => {
    const dataToSave = newData || formData;
    setSaving(true);
    setSuccess(false);
    try {
      await api.patch("/v1/merchants/me", {
        name: dataToSave.businessName,
        email: dataToSave.businessEmail,
        logoUrl: dataToSave.logoUrl,
        returnUrl: dataToSave.returnUrl,
        feeResponsibility: dataToSave.feeResponsibility,
        invoiceExpirationMinutes: dataToSave.invoiceExpirationMinutes,
        underpaymentTolerancePercentage:
          dataToSave.underpaymentTolerancePercentage,
        bip21Enabled: dataToSave.bip21Enabled,
        enabledCurrencies: dataToSave.enabledCurrencies,
        spreadEnabled: dataToSave.spreadEnabled,
        customSpreadRate: dataToSave.customSpreadRate,
      });
      if (newData) {
        setFormData(newData);
      }
      // Refresh session so merchant switcher re-fetches and shows the new logo
      await update();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMerchant = async () => {
    setDeleting(true);
    try {
      await api.delete("/v1/merchants/me");
      await update();
      router.push("/dashboard");
      window.location.reload();
    } catch (err: unknown) {
      console.error("Failed to delete merchant", err);
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError("");
    setTwoFACode("");
    setBackupCodes([]);
    setShowBackupCodes(false);
    try {
      const res = await api.post("/v1/merchants/me/2fa/setup");
      setTwoFASetupData({
        secret: res.data.secret,
        qrCode: res.data.qrCode,
      });
      setTwoFASetupDialogOpen(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to start 2FA setup.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await api.post("/v1/merchants/me/2fa/enable", {
        code: twoFACode,
      });
      setBackupCodes(res.data.backupCodes || []);
      setShowBackupCodes(true);
      setTwoFactorEnabled(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid code. Please try again.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      await api.post("/v1/merchants/me/2fa/disable", { code: twoFACode });
      setTwoFactorEnabled(false);
      setTwoFADisableDialogOpen(false);
      setTwoFACode("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid code. Please try again.";
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  return {
    loading,
    saving,
    success,
    deleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteConfirmationName,
    setDeleteConfirmationName,
    formData,
    setFormData,
    twoFactorEnabled,
    twoFASetupDialogOpen,
    setTwoFASetupDialogOpen,
    twoFADisableDialogOpen,
    setTwoFADisableDialogOpen,
    twoFASetupData,
    twoFACode,
    setTwoFACode,
    twoFALoading,
    twoFAError,
    setTwoFAError,
    backupCodes,
    showBackupCodes,
    setShowBackupCodes,
    handleSave,
    handleDeleteMerchant,
    handleSetup2FA,
    handleEnable2FA,
    handleDisable2FA,
  };
}
