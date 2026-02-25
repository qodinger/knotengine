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
    <div className="flex flex-col gap-6">
      <EcosystemHeader />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {partners.map((partner) => (
          <Card
            key={partner.id}
            className="border-border/40 group hover:border-border/80 bg-background/50 relative overflow-hidden backdrop-blur-sm transition-all"
          >
            {/* Glossy background effect */}
            <div
              className={cn(
                "absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]",
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
                "absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 opacity-20 blur-3xl transition-opacity group-hover:opacity-40",
                partner.bg,
              )}
            />

            <CardHeader className="relative pb-4">
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-2xl p-3 transition-transform duration-500 group-hover:scale-110",
                    partner.bg,
                    partner.color,
                  )}
                >
                  <partner.icon className="size-6" />
                </div>
                <Badge
                  variant="outline"
                  className="bg-background/50 border-white/5 text-[9px] font-bold tracking-widest uppercase backdrop-blur-sm"
                >
                  {partner.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {partner.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-relaxed">
                {partner.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/3 p-3 transition-colors group-hover:bg-white/5">
                <Info className="text-muted-foreground/60 size-4" />
                <span className="text-xs font-semibold tracking-tight">
                  {partner.benefit}
                </span>
              </div>
            </CardContent>

            <CardFooter className="relative pt-2">
              <Button
                asChild
                variant="outline"
                className="group/btn h-10 w-full border-white/5 text-xs font-bold tracking-widest uppercase transition-all hover:bg-white hover:text-black"
              >
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {partner.cta}
                  <ArrowUpRight className="size-3.5 opacity-50 transition-all group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:opacity-100" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 bg-muted/5 relative overflow-hidden border-2 border-dashed">
        <div className="to-primary/5 absolute inset-0 bg-linear-to-b from-transparent opacity-50" />
        <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-primary/10 border-primary/20 mb-6 flex size-12 items-center justify-center rounded-full border">
            <Puzzle className="text-primary size-6" />
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/20 text-primary border-primary/20 mb-4 px-3 py-1 text-[9px] font-bold tracking-widest uppercase"
          >
            KnotEngine Labs
          </Badge>
          <h3 className="mb-3 text-2xl font-bold tracking-tight">
            Want to partner with us?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-sm text-sm leading-relaxed antialiased">
            We are always looking for high-quality tools that help our merchants
            grow. If you build infrastructure for Web3, we&apos;d love to talk.
          </p>
          <Button
            variant="outline"
            className="border-primary/20 hover:bg-primary/10 h-11 rounded-full px-8 text-xs font-black tracking-widest uppercase transition-colors"
          >
            Contact Partnership Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
