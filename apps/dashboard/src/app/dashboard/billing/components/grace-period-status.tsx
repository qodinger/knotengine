"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GracePeriodStatusProps {
  isActive: boolean;
  daysRemaining?: number;
  planName: string;
  onActivate?: () => void;
  isCharging?: boolean;
}

export function GracePeriodStatus({
  isActive,
  daysRemaining,
  planName,
  onActivate,
  isCharging,
}: GracePeriodStatusProps) {
  if (!isActive) return null;

  const isUrgent = daysRemaining !== undefined && daysRemaining <= 3;
  const isExpired = daysRemaining === 0;

  return (
    <Card
      className={`border-2 ${isExpired ? "border-red-200 bg-red-50" : isUrgent ? "border-orange-200 bg-orange-50" : "border-yellow-200 bg-yellow-50"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 ${isExpired ? "text-red-500" : isUrgent ? "text-orange-500" : "text-yellow-500"}`}
          >
            {isExpired ? (
              <AlertTriangle className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </div>
          <div className="flex-1">
            <h4
              className={`font-semibold ${isExpired ? "text-red-700" : isUrgent ? "text-orange-700" : "text-yellow-700"}`}
            >
              {isExpired ? "Grace Period Expired" : "Grace Period Active"}
            </h4>

            {isExpired ? (
              <p className="mt-1 text-sm text-red-600">
                Your {planName} plan has been downgraded to Starter due to
                insufficient balance.
              </p>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <p
                    className={`${isUrgent ? "text-orange-600" : "text-yellow-600"} mt-1 text-sm`}
                  >
                    {daysRemaining !== undefined && (
                      <>
                        {daysRemaining} day{daysRemaining === 1 ? "" : "s"}{" "}
                        remaining until automatic downgrade to Starter plan.
                      </>
                    )}
                  </p>

                  <Button
                    size="sm"
                    onClick={onActivate}
                    disabled={isCharging}
                    className={cn(
                      "h-8 gap-1.5 text-[10px] font-bold tracking-wider uppercase",
                      isUrgent
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-yellow-600 hover:bg-yellow-700",
                    )}
                  >
                    {isCharging ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Zap className="size-3" />
                    )}
                    Activate Plan
                  </Button>
                </div>
                {daysRemaining && daysRemaining <= 3 && (
                  <div className="mt-3 rounded border border-current/20 bg-white/50 p-2">
                    <p className="text-xs font-medium text-current">
                      ⚠️ Action required: Top up now to keep your {planName}{" "}
                      plan benefits.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-3 text-xs opacity-75">
              <p>Plan features will remain active during the grace period.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
