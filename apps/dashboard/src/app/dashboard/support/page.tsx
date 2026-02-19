"use client";

import {
  LifeBuoy,
  MessageSquare,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Send,
  Search,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const HELP_CATEGORIES = [
  {
    title: "Integration Guide",
    description: "SDKs, API reference, and platform webhooks.",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Billing & Payouts",
    description: "Fee structure, settlement logic, and limits.",
    icon: HelpCircle,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Security & Keys",
    description: "API key safety, scoped access, and IP-whitelisting.",
    icon: BookOpen,
    color: "bg-purple-500/10 text-purple-500",
  },
];

const FAQS = [
  "How do I upgrade my settlement limits?",
  "What is the average transaction verification time?",
  "How to enable automatic treasury sweeps?",
  "Managing multi-chain asset pools.",
];

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2 py-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
          KnotEngine Merchant Center
        </h1>
        <p className="text-muted-foreground font-medium text-lg">
          How can we help scale your non-custodial infrastructure today?
        </p>
        <div className="max-w-2xl mx-auto mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
          <Input
            placeholder="Search documentation, guides, or error codes..."
            className="pl-12 h-14 text-lg bg-background/50 border-border/50 shadow-xl shadow-primary/5 focus:bg-background transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HELP_CATEGORIES.map((cat) => (
          <Card
            key={cat.title}
            className="border-none bg-background/50 border hover:bg-background/80 transition-all group cursor-pointer"
          >
            <CardHeader>
              <div
                className={`size-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cat.color}`}
              >
                <cat.icon className="size-6" />
              </div>
              <CardTitle className="text-lg font-bold tracking-tight mb-1">
                {cat.title}
              </CardTitle>
              <CardDescription className="text-sm font-medium leading-relaxed">
                {cat.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                className="p-0 text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-transparent group-hover:gap-3 transition-all"
              >
                Browse Guides
                <ArrowRight className="size-3 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid gap-3">
            {FAQS.map((faq) => (
              <div
                key={faq}
                className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/30 hover:border-primary/30 hover:bg-background/60 transition-all cursor-pointer group"
              >
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  {faq}
                </span>
                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
          <Button
            variant="link"
            className="text-primary font-bold uppercase text-[10px] tracking-widest p-0 h-auto"
          >
            View All Documentation
            <ExternalLink className="size-3 ml-2" />
          </Button>
        </div>

        <Card className="border-none bg-primary/5 border border-primary/10 shadow-none overflow-hidden relative">
          <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <MessageCircle className="size-5" />
            </div>
            <CardTitle>Priority Support</CardTitle>
            <CardDescription className="font-medium">
              Direct access to our engineering team for high-stakes integration
              queries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-background/50 border border-primary/10 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                  Average Response Time
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-bold bg-emerald-500/10 text-emerald-500 border-none px-0 shadow-none"
                  >
                    Under 15 minutes
                  </Badge>
                </div>
              </div>
              <div className="h-px bg-primary/10" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                  Active Sessions
                </p>
                <p className="font-bold text-sm">3 Engineers Available</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full font-bold uppercase text-xs tracking-widest gap-2 bg-primary py-6 shadow-xl shadow-primary/20">
              <Send className="size-4" />
              Start Support Session
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="bg-muted/30 rounded-3xl p-8 mt-4 flex flex-col md:flex-row items-center justify-between gap-6 border border-border/10">
        <div className="flex items-center gap-6">
          <div className="size-16 rounded-2xl bg-background flex items-center justify-center shadow-sm">
            <LifeBuoy className="size-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Need a dedicated specialist?
            </h3>
            <p className="text-muted-foreground text-sm font-medium">
              Enterprise partners get 24/7 Slack and on-call infrastructure
              support.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="font-bold uppercase text-[10px] tracking-widest px-8"
        >
          Upgrade for Enterprise
        </Button>
      </div>
    </div>
  );
}
