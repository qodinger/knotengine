"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios";
import { format } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

type Invoice = {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  confirmations: number;
  required_confirmations: number;
  tx_hash: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [apiKey, setApiKey] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null,
  );

  useEffect(() => {
    if (apiKey) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [apiKey, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await axios.get(`${API_BASE_URL}/v1/invoices`, {
        headers: { "x-api-key": apiKey },
        params,
      });
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.crypto_currency.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!apiKey) {
    return (
      <ApiKeyRequired
        onSetKey={(key) => {
          localStorage.setItem("tp_api_key", key);
          setApiKey(key);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">
            Invoices
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Manage and track your merchant payment requests.
          </p>
        </div>
        <button className="px-6 py-3 bg-neon-purple text-black font-black uppercase tracking-widest rounded-xl hover:bg-neon-purple/80 transition-all text-xs">
          Create Invoice
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-neon-blue transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by ID or Currency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass bg-white/5 border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:neon-border transition-all"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass bg-black border-white/5 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none hover:bg-white/5 transition-all outline-none appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="expired">Expired</option>
          </select>

          <button className="glass bg-white/5 border-white/5 rounded-xl px-4 py-4 hover:neon-border transition-all flex items-center gap-2 text-sm font-bold">
            <Filter size={18} />
            Sort
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">
                    Invoice ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Amount (USD)</th>
                <th className="px-6 py-5">Crypto Amount</th>
                <th className="px-6 py-5">Created</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-white/20 font-black italic uppercase tracking-widest animate-pulse"
                    >
                      Encrypting Data Streams...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-white/20 font-black italic uppercase tracking-widest"
                    >
                      No Records Found in Database
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, i) => (
                    <motion.tr
                      key={inv.invoice_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold group-hover:text-neon-blue transition-colors">
                            {inv.invoice_id}
                          </span>
                          {inv.tx_hash && (
                            <div className="flex items-center gap-1 mt-1 text-[8px] opacity-30 group-hover:opacity-60">
                              <CheckCircle2
                                size={10}
                                className="text-green-500"
                              />
                              <span className="truncate max-w-[100px]">
                                {inv.tx_hash}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black">
                          ${inv.amount_usd.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">
                            {inv.crypto_amount}
                          </span>
                          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded opacity-60 font-black">
                            {inv.crypto_currency}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs opacity-40 font-medium">
                          {format(new Date(inv.created_at), "MMM dd, HH:mm")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-neon-blue">
                            <ExternalLink size={16} />
                          </button>
                          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
          <span>Showing {filteredInvoices.length} entries</span>
          <div className="flex gap-2">
            <button
              disabled
              className="px-3 py-1 glass rounded-md opacity-20 cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled
              className="px-3 py-1 glass rounded-md opacity-20 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const configs = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
    confirmed: {
      label: "Confirmed",
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    expired: {
      label: "Expired",
      icon: XCircle,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
    },
    partially_paid: {
      label: "Warning",
      icon: AlertCircle,
      color: "text-neon-pink bg-neon-pink/10 border-neon-pink/20",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter",
        config.color,
      )}
    >
      <Icon size={12} />
      {config.label}
    </div>
  );
}

function ApiKeyRequired({ onSetKey }: { onSetKey: (key: string) => void }) {
  const [input, setInput] = useState("");

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center p-8 animate-in zoom-in duration-500">
      <div className="glass-card p-10 max-w-md w-full text-center border-neon-purple/50">
        <div className="w-16 h-16 bg-neon-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search size={32} className="text-neon-purple" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
          API Key Required
        </h2>
        <p className="text-white/40 text-sm mb-8">
          Accessing protected merchant records requires a secure TyePay API key.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="tye_..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full glass bg-black border-white/10 rounded-xl px-5 py-4 font-mono text-sm focus:neon-border outline-none transition-all"
          />
          <button
            onClick={() => onSetKey(input)}
            className="w-full py-4 bg-neon-purple text-black font-black uppercase tracking-widest rounded-xl hover:neon-purple/80 transition-all text-xs"
          >
            Authenticate Session
          </button>
        </div>
      </div>
    </div>
  );
}
