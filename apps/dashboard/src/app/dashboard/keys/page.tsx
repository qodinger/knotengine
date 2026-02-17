"use client";

import { useState } from "react";
import {
  RotateCw,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export default function KeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null,
  );
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rotateKey = async () => {
    if (
      !confirm(
        "WARNING: Rotating your API key will immediately invalidate your current key. Any integrations using the old key will break. Continue?",
      )
    ) {
      return;
    }

    setRotating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/v1/merchants/me/keys`,
        {},
        {
          headers: { "x-api-key": apiKey },
        },
      );

      const newKey = res.data.apiKey;
      setNewKeyGenerated(newKey);
      localStorage.setItem("tp_api_key", newKey);
      setApiKey(newKey);
    } catch (err) {
      console.error("Failed to rotate key", err);
      alert("Failed to rotate API key. Please check your connection.");
    } finally {
      setRotating(false);
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

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">
          API Keys
        </h1>
        <p className="text-white/40 text-sm font-medium">
          Secure credentials for your payment integration.
        </p>
      </div>

      {/* Main Key Card */}
      <div className="glass-card p-1 border-white/5 bg-gradient-to-br from-neon-purple/5 to-transparent">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-purple/20 rounded-lg">
                <Shield className="text-neon-purple" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Active API Secret
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  Environment: Production
                </p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div
              className={cn(
                "w-full glass bg-black border-white/10 rounded-xl px-6 py-6 font-mono text-sm flex items-center justify-between transition-all",
                newKeyGenerated
                  ? "border-neon-blue neon-shadow"
                  : "group-hover:border-white/20",
              )}
            >
              <span
                className={cn(
                  "truncate mr-4",
                  !showKey && !newKeyGenerated ? "blur-md select-none" : "",
                )}
              >
                {newKeyGenerated || apiKey}
              </span>

              <div className="flex items-center gap-2">
                {!newKeyGenerated && (
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(newKeyGenerated || apiKey)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-neon-blue"
                >
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {newKeyGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-neon-blue/10 border border-neon-blue/20 rounded-xl flex items-start gap-3"
              >
                <Info size={18} className="text-neon-blue shrink-0 mt-0.5" />
                <p className="text-xs text-neon-blue font-bold leading-relaxed uppercase tracking-tight">
                  NEW KEY GENERATED! Make sure to copy it now. For security, we
                  do not store raw keys. This is the last time you will see this
                  secret.
                </p>
              </motion.div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-white/40">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                Never share your secret key in client-side code.
              </span>
            </div>

            <button
              onClick={rotateKey}
              disabled={rotating}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                rotating
                  ? "bg-white/5 text-white/20"
                  : "bg-white/5 text-white/60 hover:bg-neon-pink/20 hover:text-neon-pink hover:border-neon-pink/30 border border-white/5",
              )}
            >
              <RotateCw size={14} className={rotating ? "animate-spin" : ""} />
              {rotating ? "Rotating..." : "Rotate Secret Key"}
            </button>
          </div>
        </div>
      </div>

      {/* Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-white/5 opacity-60">
          <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neon-blue rounded-full" />
            Basic Usage
          </h4>
          <pre className="bg-black/50 p-4 rounded-lg text-[10px] font-mono text-white/60 overflow-x-auto">
            {`curl -X POST ${API_BASE_URL}/v1/invoices \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{ "amount_usd": 100, "currency": "BTC" }'`}
          </pre>
        </div>

        <div className="glass-card p-6 border-white/5 opacity-60">
          <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-neon-pink rounded-full" />
            Best Practices
          </h4>
          <ul className="text-[10px] font-bold uppercase tracking-widest text-white/40 space-y-3">
            <li className="flex items-start gap-2">
              <Check size={10} className="text-neon-blue mt-0.5" />
              Store keys in .env variables only.
            </li>
            <li className="flex items-start gap-2">
              <Check size={10} className="text-neon-blue mt-0.5" />
              Rotate keys every 90 days.
            </li>
            <li className="flex items-start gap-2">
              <Check size={10} className="text-neon-blue mt-0.5" />
              Use separate keys for Dev/Prod.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
