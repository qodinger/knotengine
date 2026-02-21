import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { Currency } from "@qodinger/knot-types";
import { StatsData } from "../types";

export function useBilling() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Claiming State
  const [txHash, setTxHash] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | "">("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpStep, setTopUpStep] = useState<1 | 2>(1);
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
    return stats.platformFeeWallets.EVM;
  };

  const handleGeneratePayment = async () => {
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
      setGenerateError("Please enter a valid USD amount.");
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

  return {
    stats,
    loading,
    copiedField,
    txHash,
    setTxHash,
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
  };
}
