"use client";

import { ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FeaturedPartner() {
  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-emerald-500/5">
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-emerald-500/10 blur-3xl" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Secure Your Merchant Funds</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Don't leave your earnings on a hot wallet. Get a Ledger hardware
                wallet and manage your funds with industry-leading security.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              variant="ghost"
              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
            >
              <Link href="/dashboard/ecosystem">View All Partners</Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-none"
            >
              <a
                href="https://affiliate.ledger.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get 15% Off Ledger
                <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
