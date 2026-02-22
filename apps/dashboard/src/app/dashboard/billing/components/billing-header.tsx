import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillingHeaderProps {
  onTopUpClick: () => void;
  isTopUpDisabled: boolean;
  currentPlan?: string;
}

export function BillingHeader({
  onTopUpClick,
  isTopUpDisabled,
  currentPlan = "starter",
}: BillingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
          <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border border-primary/20">
            {currentPlan}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your prepaid credit balance and view platform usage fees.
        </p>
      </div>

      <Button
        onClick={onTopUpClick}
        disabled={isTopUpDisabled}
        className="w-full sm:w-auto gap-2"
      >
        <Zap className="size-4" />
        Top Up Credits
      </Button>
    </div>
  );
}
