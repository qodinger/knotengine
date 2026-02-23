"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { ASSET_CONFIG, NETWORK_CONFIG } from "@qodinger/knot-types";
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

  const wallets = useMemo<WalletInfo[]>(() => {
    if (!merchant) return [];

    const list: WalletInfo[] = [];
    const enabled = merchant.enabledCurrencies || [];

    // Iterate through all supported assets and their networks
    Object.entries(NETWORK_CONFIG).forEach(([coinId, networks]) => {
      networks.forEach((net) => {
        if (enabled.includes(net.id)) {
          const address = merchant[net.merchantField] as
            | string
            | null
            | undefined;
          if (address) {
            list.push({
              id: net.id,
              label: net.label,
              currency: coinId,
              network: net.networkName,
              address: address,
              type: net.type,
              iconUrl: net.iconUrl,
              iconColor: net.iconColor,
              iconFallback: coinId,
            });
          }
        }
      });
    });

    return list;
  }, [merchant]);

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

    // Detection logic can still be local as it's UX-based,
    // but ideally we could also offload this to the backend if complex
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
      // Find the network config to know which field to update
      let merchantField = "";
      Object.values(NETWORK_CONFIG).forEach((nets) => {
        const match = nets.find((n) => n.id === newWalletNetwork);
        if (match) merchantField = match.merchantField;
      });

      if (!merchantField) throw new Error("Invalid network selection");

      const payload: Record<string, string | string[] | null> = {
        [merchantField]: newWalletAddress,
      };

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

      // Find which field this wallet used
      let merchantField = "";
      Object.values(NETWORK_CONFIG).forEach((nets) => {
        const match = nets.find((n) => n.id === walletToRemove);
        if (match) merchantField = match.merchantField;
      });

      // If no other enabled currency uses this field, we can null it out
      if (merchantField) {
        const otherUses = updatedEnabled.some((currId) => {
          let field = "";
          Object.values(NETWORK_CONFIG).forEach((nets) => {
            if (
              nets.find((n) => n.id === currId)?.merchantField === merchantField
            ) {
              field = merchantField;
            }
          });
          return field === merchantField;
        });

        if (!otherUses) {
          payload[merchantField] = null;
        }
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
    configAssets: ASSET_CONFIG,
    configNetworks: NETWORK_CONFIG,
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
