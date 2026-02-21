import { Sparkles, Receipt, TrendingUp, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HowItWorksProps {
  feeRate: number;
}

export function HowItWorks({ feeRate }: HowItWorksProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider">
            How Billing Works
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          KnotEngine uses a prepaid credit system to keep your business running
          smoothly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Welcome Credit",
              description:
                "Every new merchant starts with $5.00 in free credit — enough to process your first $500 in sales.",
              icon: Sparkles,
              color: "text-emerald-500",
            },
            {
              step: "02",
              title: "Auto-Deduction",
              description: `A ${(feeRate * 100).toFixed(1)}% fee is deducted from your credit for each confirmed payment. Your customers pay directly to your wallet.`,
              icon: Receipt,
              color: "text-blue-500",
            },
            {
              step: "03",
              title: "Top Up",
              description:
                "When your credit runs low, send crypto to any platform wallet above. Credits are added instantly on confirmation.",
              icon: TrendingUp,
              color: "text-purple-500",
            },
            {
              step: "04",
              title: "Non-Custodial",
              description:
                "We never touch your revenue. 100% of customer payments go to your wallet. Credits only cover platform fees.",
              icon: ShieldCheck,
              color: "text-amber-500",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col gap-2 p-4 rounded-xl border border-border/30 bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/40">
                  {item.step}
                </span>
                <item.icon className={cn("size-3.5", item.color)} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          <span>
            Zero-custody guarantee — KnotEngine never holds or routes your
            customer funds.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
