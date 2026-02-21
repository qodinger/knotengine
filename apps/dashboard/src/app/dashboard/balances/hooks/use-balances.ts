"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  EVM_CURRENCIES,
  CRYPTO_LABELS,
  CRYPTO_LOGOS,
} from "@qodinger/knot-types";
import { MerchantProfile, StatsData, Invoice, WalletInfo } from "../types";

export function useBalances() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletCoin, setNewWalletCoin] = useState<string>("");
  const [newWalletNetwork, setNewWalletNetwork] = useState<string>("");
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  const [walletToRemove, setWalletToRemove] = useState<string | null>(null);
  const [isRemovingWallet, setIsRemovingWallet] = useState(false);

  const wallets: WalletInfo[] = [];
  if (merchant) {
    const isEnabled = (id: string) => merchant.enabledCurrencies?.includes(id);

    if (merchant.btcXpub) {
      if (isEnabled("BTC")) {
        wallets.push({
          id: "BTC",
          label: CRYPTO_LABELS.BTC,
          currency: "BTC",
          network: "Bitcoin",
          address: merchant.btcXpub,
          type: "HD Wallet (xPub)",
          iconUrl: CRYPTO_LOGOS.BTC,
          iconColor: "bg-amber-500",
          iconFallback: "BTC",
        });
      }
      if (isEnabled("LTC")) {
        wallets.push({
          id: "LTC",
          label: CRYPTO_LABELS.LTC,
          currency: "LTC",
          network: "Litecoin",
          address: merchant.btcXpub,
          type: "HD Wallet (xPub)",
          iconUrl: CRYPTO_LOGOS.LTC,
          iconColor: "bg-blue-600",
          iconFallback: "LTC",
        });
      }
    }
    if (merchant.ethAddress) {
      if (isEnabled("ETH")) {
        wallets.push({
          id: "ETH",
          label: CRYPTO_LABELS.ETH,
          currency: "ETH",
          network: "Ethereum (ERC20)",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.ETH,
          iconColor: "bg-indigo-500",
          iconFallback: "ETH",
        });
      }
      if (isEnabled("USDT_ERC20")) {
        wallets.push({
          id: "USDT_ERC20",
          label: CRYPTO_LABELS.USDT_ERC20,
          currency: "USDT",
          network: "Ethereum (ERC20)",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.USDT_ERC20,
          iconColor: "bg-emerald-500",
          iconFallback: "USDT",
        });
      }
      if (isEnabled("USDT_POLYGON")) {
        wallets.push({
          id: "USDT_POLYGON",
          label: CRYPTO_LABELS.USDT_POLYGON,
          currency: "USDT",
          network: "Polygon",
          address: merchant.ethAddress,
          type: "Static Address",
          iconUrl: CRYPTO_LOGOS.USDT_POLYGON,
          iconColor: "bg-emerald-600",
          iconFallback: "USDT",
        });
      }
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [merchantRes, statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/merchants/me/stats"),
        api.get("/v1/invoices", { params: { limit: 100 } }),
      ]);
      setMerchant(merchantRes.data);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
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

  const handleAddressChange = (val: string) => {
    setNewWalletAddress(val);
    const input = val.trim();
    if (!input) return;

    if (/^[xyzvtu]pub[1-9A-HJ-NP-Za-km-z]{10,}$/i.test(input)) {
      setNewWalletCoin("BTC");
      setNewWalletNetwork("BTC");
      return;
    }

    if (/^(1|3|bc1q|bc1p)[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(input)) {
      setNewWalletCoin("BTC");
      setNewWalletNetwork("BTC");
      return;
    }

    if (/^(L|M|ltc1)[a-zA-HJ-NP-Z0-9]{25,62}$/i.test(input)) {
      setNewWalletCoin("LTC");
      setNewWalletNetwork("LTC");
      return;
    }

    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
      if (
        !newWalletCoin ||
        newWalletCoin === "BTC" ||
        newWalletCoin === "LTC"
      ) {
        setNewWalletCoin("ETH");
        setNewWalletNetwork("ETH");
      }
      return;
    }
  };

  const handleAddWallet = async () => {
    setIsAddingWallet(true);
    try {
      const payload: Record<string, string | string[] | null> = {};
      if (newWalletNetwork === "BTC" || newWalletNetwork === "LTC") {
        payload.btcXpub = newWalletAddress;
      } else {
        payload.ethAddress = newWalletAddress;
      }

      const updatedEnabled = [...(merchant?.enabledCurrencies || [])];
      if (!updatedEnabled.includes(newWalletNetwork)) {
        updatedEnabled.push(newWalletNetwork);
      }
      payload.enabledCurrencies = updatedEnabled;

      await api.patch("/v1/merchants/me", payload);
      await fetchData();
      setIsAddWalletOpen(false);
      setNewWalletAddress("");
      setNewWalletCoin("");
      setNewWalletNetwork("");
    } catch (err) {
      console.error("Failed to add wallet", err);
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleRemoveWallet = async () => {
    if (!walletToRemove) return;
    setIsRemovingWallet(true);
    try {
      const payload: Record<string, string | string[] | null> = {};
      const updatedEnabled = (merchant?.enabledCurrencies || []).filter(
        (c) => c !== walletToRemove,
      );
      payload.enabledCurrencies = updatedEnabled;

      const btcRelated = ["BTC", "LTC"];
      if (
        btcRelated.includes(walletToRemove) &&
        !updatedEnabled.some((c) => btcRelated.includes(c))
      ) {
        payload.btcXpub = null;
      }
      if (
        EVM_CURRENCIES.includes(
          walletToRemove as (typeof EVM_CURRENCIES)[number],
        ) &&
        !updatedEnabled.some((c) =>
          EVM_CURRENCIES.includes(c as (typeof EVM_CURRENCIES)[number]),
        )
      ) {
        payload.ethAddress = null;
      }

      await api.patch("/v1/merchants/me", payload);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove wallet", err);
    } finally {
      setIsRemovingWallet(false);
      setWalletToRemove(null);
    }
  };

  return {
    wallets,
    merchant,
    stats,
    invoices,
    loading,
    copiedField,
    isAddWalletOpen,
    setIsAddWalletOpen,
    newWalletAddress,
    setNewWalletAddress,
    newWalletCoin,
    setNewWalletCoin,
    newWalletNetwork,
    setNewWalletNetwork,
    isAddingWallet,
    walletToRemove,
    setWalletToRemove,
    isRemovingWallet,
    copyAddress,
    handleAddressChange,
    handleAddWallet,
    handleRemoveWallet,
    fetchData,
  };
}
