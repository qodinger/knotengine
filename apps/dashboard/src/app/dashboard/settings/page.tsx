"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Wallet,
  ShieldCheck,
  Webhook,
  User,
  Info,
  Bitcoin,
  Globe,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export default function SettingsPage() {
  const apiKey =
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    btcXpub: "",
    ethAddress: "",
    webhookUrl: "",
    confirmationPolicy: {
      BTC: 2,
      LTC: 6,
      ETH: 12,
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/merchants/me`, {
        headers: { "x-api-key": apiKey },
      });
      setFormData({
        name: res.data.name || "",
        btcXpub: res.data.btcXpub || "",
        ethAddress: res.data.ethAddress || "",
        webhookUrl: res.data.webhookUrl || "",
        confirmationPolicy: res.data.confirmationPolicy || {
          BTC: 2,
          LTC: 6,
          ETH: 12,
        },
      });
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [apiKey, fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await axios.patch(`${API_BASE_URL}/v1/merchants/me`, formData, {
        headers: { "x-api-key": apiKey },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Error saving settings. Please check your data.");
    } finally {
      setSaving(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-white/40 italic uppercase tracking-widest font-black">
          Session Authentication Required
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="text-neon-blue animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">
            Merchant Settings
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Configure your core infrastructure and payment policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all",
            success
              ? "bg-green-500 text-black"
              : "bg-neon-blue text-black hover:bg-neon-blue/80 shadow-[0_0_20px_rgba(0,242,255,0.2)]",
          )}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Syncing..." : success ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <User className="text-neon-blue" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">
              Public Profile
            </h3>
          </div>
          <div className="glass-card p-8 border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Tyecode Labs"
                  className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-sm font-bold focus:neon-border outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Support Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="support@example.com"
                  className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-sm font-bold focus:neon-border outline-none transition-all opacity-40 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Wallet Strategy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Wallet className="text-neon-purple" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">
              Wallet Strategy
            </h3>
          </div>
          <div className="glass-card p-8 border-white/5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 flex items-center gap-2">
                  Bitcoin xPub (Extended Public Key)
                  <Info size={12} className="opacity-40 cursor-help" />
                </label>
                <span className="text-[8px] font-black px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded uppercase">
                  BTC Native SegWit
                </span>
              </div>
              <textarea
                value={formData.btcXpub}
                onChange={(e) =>
                  setFormData({ ...formData, btcXpub: e.target.value })
                }
                placeholder="xpub..."
                rows={2}
                className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-xs font-mono font-bold focus:neon-border outline-none transition-all"
              />
              <p className="text-[10px] text-white/20 font-medium italic">
                We use this to derive a unique address for every customer. We
                never see your private keys.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                Ethereum Destination Address
              </label>
              <input
                type="text"
                value={formData.ethAddress}
                onChange={(e) =>
                  setFormData({ ...formData, ethAddress: e.target.value })
                }
                placeholder="0x..."
                className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-sm font-mono font-bold focus:neon-border outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Confirmation Rules Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">
              Confirmation Rules
            </h3>
          </div>
          <div className="glass-card p-8 border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(formData.confirmationPolicy).map(
                ([coin, value]) => (
                  <div key={coin} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {coin === "BTC" ? (
                          <Bitcoin size={18} className="text-yellow-500" />
                        ) : (
                          <Globe size={18} className="text-neon-blue" />
                        )}
                      </div>
                      <span className="text-xs font-black">{coin} Network</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmationPolicy: {
                              ...formData.confirmationPolicy,
                              [coin]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-sm font-black focus:neon-border outline-none transition-all pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-white/20">
                        Blocks
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
              <Info size={16} className="text-white/40 shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/40 font-bold leading-relaxed uppercase tracking-tight">
                Higher block confirmations increase security against
                double-spends but result in longer wait times for your
                customers. Setting to 0 allows &quot;Instant&quot; mempool-based
                confirmation (Highest danger).
              </p>
            </div>
          </div>
        </section>

        {/* Webhooks Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Webhook className="text-neon-pink" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">
              Webhooks
            </h3>
          </div>
          <div className="glass-card p-8 border-white/5 space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
              Universal Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) =>
                setFormData({ ...formData, webhookUrl: e.target.value })
              }
              placeholder="https://api.yourstore.com/webhooks/tyepay"
              className="w-full glass bg-black/50 border-white/10 rounded-xl px-5 py-4 text-sm font-bold focus:neon-border outline-none transition-all"
            />
            <p className="text-[10px] text-white/20 font-medium italic">
              We will send a POST request to this URL for every payout and
              confirmation event.
            </p>
          </div>
        </section>
      </form>
    </div>
  );
}
