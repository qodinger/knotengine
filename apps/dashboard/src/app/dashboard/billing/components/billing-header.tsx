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
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
          <div className="bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
            {currentPlan}
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your prepaid credit balance and view platform usage fees.
        </p>
      </div>

      <Button
        onClick={onTopUpClick}
        disabled={isTopUpDisabled}
        className="w-full gap-2 sm:w-auto"
      >
        <Zap className="size-4" />
        Top Up Credits
      </Button>
    </div>
  );
}
