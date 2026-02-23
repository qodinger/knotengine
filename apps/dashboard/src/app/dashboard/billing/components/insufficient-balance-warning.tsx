"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface InsufficientBalanceWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredAmount: number;
  currentBalance: number;
  planName: string;
  isProrated?: boolean;
  onTopUp?: () => void;
}

export function InsufficientBalanceWarning({
  open,
  onOpenChange,
  requiredAmount,
  currentBalance,
  planName,
  isProrated = false,
  onTopUp,
}: InsufficientBalanceWarningProps) {
  const description = isProrated
    ? `Insufficient balance to upgrade to ${planName}. You need at least $${requiredAmount.toFixed(2)} in credits (prorated for this month).`
    : `Insufficient balance to upgrade to ${planName}. You need at least $${requiredAmount.toFixed(2)} in credits.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-500" />
            <AlertDialogTitle>Insufficient Balance</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm">
            {description}
            <div className="bg-muted mt-3 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">
                  ${currentBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Required:</span>
                <span className="font-medium text-orange-600">
                  ${requiredAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Shortfall:</span>
                <span className="text-red-600">
                  ${(requiredAmount - currentBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              onTopUp?.();
            }}
          >
            Top Up Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
