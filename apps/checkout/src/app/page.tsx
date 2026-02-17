"use client";

import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [invId, setInvId] = useState("");
  const router = useRouter();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (invId.startsWith("inv_")) {
      router.push(`/checkout/${invId}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <CyberpunkBackground />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-6 drop-shadow-[0_0_15px_rgba(157,0,255,0.4)]">
          <span className="text-neon-purple">Tye</span>
          <span className="opacity-80 text-white">Pay</span>
        </h1>
        <p className="opacity-40 text-sm font-bold tracking-[0.2em] uppercase mb-12">
          Agentic Payment Infrastructure
        </p>

        <form onSubmit={handleGo} className="relative w-full max-w-sm group">
          <input
            type="text"
            placeholder="ENTER INVOICE ID (inv_...)"
            value={invId}
            onChange={(e) => setInvId(e.target.value)}
            className="w-full glass py-5 px-6 rounded-2xl border-white/5 bg-white/5 focus:border-neon-blue/50 transition-all outline-none font-mono text-xs uppercase tracking-widest"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-neon-blue text-black rounded-xl hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-12 flex gap-8 justify-center opacity-20 text-[10px] font-black uppercase tracking-widest">
          <span>No Middlemen</span>
          <span>No Custody</span>
          <span>Pure Code</span>
        </div>
      </motion.div>
    </main>
  );
}
