import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { Currency } from "@qodinger/knot-types";
import { StatsData } from "../types";
import { toast } from "sonner";

export function useBilling() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState<{
    open: boolean;
    requiredAmount: number;
    currentBalance: number;
    planName: string;
    isProrated: boolean;
  } | null>(null);

  // Claiming State
  const [txHash, setTxHash] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | "">("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpStep, setTopUpStep] = useState<1 | 2 | 3>(1);
  const [usdAmount, setUsdAmount] = useState<string>("10.00");
  const [cryptoAmount, setCryptoAmount] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyAddress = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetTopUpModal = () => {
    setTopUpStep(1);
    setIsGenerating(false);
    setGenerateError(null);
    setTxHash("");
    setClaimStatus(null);
    setCryptoAmount(null);
    setSelectedCoin("");
    setSelectedCurrency("");
    setUsdAmount("10.00");
  };

  const handleOpenTopUp = () => {
    resetTopUpModal();
    setIsTopUpOpen(true);
  };

  const getWalletAddress = (currency: string) => {
    if (!stats?.platformFeeWallets) return null;
    if (currency === "BTC") return stats.platformFeeWallets.BTC;
    if (currency === "LTC") return stats.platformFeeWallets.LTC;
    // All EVM-based currencies (ETH, USDT_ERC20, USDT_POLYGON) share the same wallet
    return stats.platformFeeWallets.EVM;
  };

  const handleGeneratePayment = async () => {
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) < 5) {
      setGenerateError("Minimum top-up amount is $5.00.");
      return;
    }
    if (!selectedCurrency) {
      setGenerateError("Please select a cryptocurrency.");
      return;
    }
    const address = getWalletAddress(selectedCurrency);
    if (!address) {
      setGenerateError("Platform wallet not configured for this currency.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.get(`/v1/price/${selectedCurrency}`);
      const price = res.data?.price_usd;
      if (price && price > 0) {
        setCryptoAmount(Number(usdAmount) / price);
        setTopUpStep(2);
      } else {
        setGenerateError("Unable to fetch price, please try again.");
      }
    } catch {
      setGenerateError("Failed to fetch current currency price.");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitClaim = async () => {
    if (!txHash || txHash.length < 10) {
      setClaimStatus({ error: "Please enter a valid Transaction Hash." });
      return;
    }
    if (!selectedCurrency) {
      setClaimStatus({ error: "Please select the currency you sent." });
      return;
    }

    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const res = await api.post("/v1/merchants/me/topup", {
        txHash: txHash.trim(),
        currency: selectedCurrency,
      });
      setClaimStatus({
        success: true,
        message: `Success! Added $${res.data.addedUsd.toFixed(2)} to your balance.`,
      });
      setTxHash("");
      await fetchData(); // Refresh billing data
    } catch (err: unknown) {
      let errorResponse = "Failed to verify transaction.";
      if (axios.isAxiosError(err)) {
        errorResponse = err.response?.data?.error || errorResponse;
      }
      setClaimStatus({
        error: errorResponse,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUpdatePlan = async (newPlan: string) => {
    try {
      setLoading(true);
      await api.post("/v1/merchants/me/plan", { plan: newPlan });
      await fetchData();
      toast.success(`Plan updated to ${newPlan}!`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.required && errorData?.currentBalance !== undefined) {
          // Show insufficient balance warning
          setInsufficientBalance({
            open: true,
            requiredAmount: errorData.required,
            currentBalance: errorData.currentBalance,
            planName: newPlan.charAt(0).toUpperCase() + newPlan.slice(1),
            isProrated: errorData.isProrated || false,
          });
          setLoading(false);
          return; // Handled, don't log to console
        }
      }

      console.error("Failed to update plan", err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to update plan");
      } else {
        toast.error("Failed to update plan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWarningClose = async () => {
    // Refresh data when warning is closed to get updated balance
    await fetchData();
  };

  const handleChargePlan = async () => {
    try {
      setLoading(true);
      const response = await api.post("/v1/merchants/me/charge-plan");

      if (response.data.success) {
        // Refresh data to show updated balance and cleared grace period
        await fetchData();

        toast.success(
          `Payment successful! $${response.data.charged} charged. Your plan is now active.`,
        );
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.required && errorData?.currentBalance !== undefined) {
          // Show insufficient balance warning
          setInsufficientBalance({
            open: true,
            requiredAmount: errorData.required,
            currentBalance: errorData.currentBalance,
            planName: "Current Plan",
            isProrated: false,
          });
          setLoading(false);
          return; // Handled, don't log to console
        }
      }

      console.error("Failed to charge plan", err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to process payment");
      } else {
        toast.error("Failed to process payment");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    copiedField,
    txHash,
    setTxHash,
    selectedCoin,
    setSelectedCoin,
    selectedCurrency,
    setSelectedCurrency,
    isClaiming,
    claimStatus,
    isTopUpOpen,
    setIsTopUpOpen,
    topUpStep,
    setTopUpStep,
    usdAmount,
    setUsdAmount,
    cryptoAmount,
    isGenerating,
    generateError,
    copyAddress,
    handleOpenTopUp,
    handleGeneratePayment,
    submitClaim,
    getWalletAddress,
    handleUpdatePlan,
    insufficientBalance,
    setInsufficientBalance,
    handleWarningClose,
    handleChargePlan,
    fetchData,
  };
}
