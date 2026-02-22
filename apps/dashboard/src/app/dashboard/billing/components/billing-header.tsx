import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillingHeaderProps {
  onTopUpClick: () => void;
  isTopUpDisabled: boolean;
}

export function BillingHeader({
  onTopUpClick,
  isTopUpDisabled,
}: BillingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Usage</h1>
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
