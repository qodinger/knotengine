import {
  Sparkles,
  Receipt,
  TrendingUp,
  ShieldCheck,
  Check,
} from "lucide-react";
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
  currentPlan?: string;
  onPlanUpdate?: (plan: "starter" | "professional" | "enterprise") => void;
}

export function HowItWorks({
  feeRate: _feeRate,
  currentPlan = "starter",
  onPlanUpdate,
}: HowItWorksProps) {
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
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Welcome Credit",
              description:
                "New merchants start with $5.00 in free credit — enough to process your first $500 in sales.",
              icon: Sparkles,
              color: "text-emerald-500",
            },
            {
              step: "02",
              title: "Auto-Deduction",
              description: `Platform fees are deducted automatically from your credit balance upon payment confirmation.`,
              icon: Receipt,
              color: "text-blue-500",
            },
            {
              step: "03",
              title: "Stablecoin Top Up",
              description:
                "Top up using USDT or USDC via Ethereum or Polygon. Credits are added 1:1 to your USD balance and deployed to yield pools.",
              icon: TrendingUp,
              color: "text-purple-500",
            },
            {
              step: "04",
              title: "Non-Custodial",
              description:
                "We never touch your revenue. 100% of customer payments go directly to your wallet.",
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

        <div className="pt-4 border-t border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Available Plans
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                name: "Starter",
                fee: "1.0%",
                cost: "$0/mo",
                features: ["1% Spread", "Single Provider"],
              },
              {
                name: "Professional",
                fee: "0.5%",
                cost: "$29/mo",
                features: ["Optional Spread", "Dual Monitoring", "Branding"],
                popular: true,
              },
              {
                name: "Enterprise",
                fee: "0.25%",
                cost: "$99/mo",
                features: ["0.2% Spread", "Priority Support", "White-label"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-4 rounded-xl border transition-all",
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-muted/10",
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-[8px] font-black uppercase text-primary-foreground rounded">
                    Most Popular
                  </span>
                )}
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold">{plan.name}</p>
                  <p className="text-xs font-black text-primary">{plan.fee}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">
                  {plan.cost}
                </p>
                <ul className="space-y-1 mb-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-[9px] text-muted-foreground flex items-center gap-1.5"
                    >
                      <Check className="size-2.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    onPlanUpdate?.(
                      plan.name.toLowerCase() as
                        | "starter"
                        | "professional"
                        | "enterprise",
                    )
                  }
                  disabled={currentPlan === plan.name.toLowerCase()}
                  className={cn(
                    "w-full py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                    currentPlan === plan.name.toLowerCase()
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-sm",
                  )}
                >
                  {currentPlan === plan.name.toLowerCase()
                    ? "Active Plan"
                    : "Select Plan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40 w-full">
          <TrendingUp className="size-3.5 text-primary shrink-0" />
          <span>
            <strong>The Float Strategy:</strong> Fee credits are held in
            yield-bearing protocols (Aave/Lido). We keep the yield to keep your
            fees low.
          </span>
        </div>
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
