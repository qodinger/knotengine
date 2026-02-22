"use client";

import {
  ArrowUpRight,
  Banknote,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  Info,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const partners = [
  {
    id: "moonpay",
    title: "MoonPay",
    category: "Off-Ramping",
    description:
      "Convert your crypto earnings directly into 160+ fiat currencies and withdraw to your bank account or debit card.",
    benefit: "Fastest way to get cash",
    status: "Available",
    icon: Banknote,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    link: "https://www.moonpay.com/business",
    cta: "Go to MoonPay",
  },
  {
    id: "ledger",
    title: "Ledger",
    category: "Security",
    description:
      "Keep your merchant funds safe with hardware-based security. Perfect for protecting your long-term xPub holdings.",
    benefit: "15% Discount via KnotEngine",
    status: "Partner Link",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    link: "https://affiliate.ledger.com",
    cta: "Buy Ledger",
  },
  {
    id: "koinly",
    title: "Koinly",
    category: "Accounting",
    description:
      "Import your KnotEngine transaction history and generate tax-compliant reports in minutes for 20+ countries.",
    benefit: "Free CSV Export Included",
    status: "Integration",
    icon: FileCheck2,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    link: "https://koinly.io/affiliate/",
    cta: "Start Reporting",
  },
  {
    id: "aave",
    title: "Aave Protocol",
    category: "Yield Optimization",
    description:
      "KnotEngine uses Aave V3 on Polygon to generate yield from your float balance, keeping our platform fees at industry lows.",
    benefit: "Supports Low Fees",
    status: "Platform Core",
    icon: TrendingUp,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    link: "https://aave.com",
    cta: "Learn More",
  },
];

import { EcosystemHeader } from "./components/ecosystem-header";

export default function EcosystemPage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <EcosystemHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((partner) => (
          <Card
            key={partner.id}
            className="relative overflow-hidden border-border/40 group hover:border-border/80 transition-all bg-background/50 backdrop-blur-sm"
          >
            {/* Glossy background effect */}
            <div
              className={cn(
                "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity",
                partner.id === "moonpay"
                  ? "bg-blue-500"
                  : partner.id === "ledger"
                    ? "bg-emerald-500"
                    : partner.id === "koinly"
                      ? "bg-orange-500"
                      : "bg-purple-500",
              )}
            />

            <div
              className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20 group-hover:opacity-40 blur-3xl transition-opacity",
                partner.bg,
              )}
            />

            <CardHeader className="relative pb-4">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                    partner.bg,
                    partner.color,
                  )}
                >
                  <partner.icon className="size-6" />
                </div>
                <Badge
                  variant="outline"
                  className="font-bold text-[9px] uppercase tracking-widest bg-background/50 backdrop-blur-sm border-white/5"
                >
                  {partner.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {partner.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm leading-relaxed mt-2 line-clamp-2">
                {partner.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/5 group-hover:bg-white/5 transition-colors">
                <Info className="size-4 text-muted-foreground/60" />
                <span className="text-xs font-semibold tracking-tight">
                  {partner.benefit}
                </span>
              </div>
            </CardContent>

            <CardFooter className="relative pt-2">
              <Button
                asChild
                variant="outline"
                className="w-full h-10 group/btn transition-all border-white/5 hover:bg-white hover:text-black font-bold text-xs uppercase tracking-widest"
              >
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {partner.cta}
                  <ArrowUpRight className="size-3.5 opacity-50 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-2 border-border/40 bg-muted/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/5 opacity-50" />
        <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Puzzle className="size-6 text-primary" />
          </div>
          <Badge
            variant="secondary"
            className="mb-4 font-bold text-[9px] uppercase tracking-widest px-3 py-1 bg-primary/20 text-primary border-primary/20"
          >
            KnotEngine Labs
          </Badge>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">
            Want to partner with us?
          </h3>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed antialiased">
            We are always looking for high-quality tools that help our merchants
            grow. If you build infrastructure for Web3, we'd love to talk.
          </p>
          <Button
            variant="outline"
            className="font-black text-xs uppercase tracking-widest h-11 px-8 rounded-full border-primary/20 hover:bg-primary/10 transition-colors"
          >
            Contact Partnership Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
