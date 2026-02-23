"use client";

import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";

interface SuccessToastProps {
  show: boolean;
}

export function SuccessToast({ show }: SuccessToastProps) {
  if (!show) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 fixed right-8 bottom-8 z-50">
      <Alert className="flex items-center gap-3 border-none bg-emerald-500 pr-8 text-white shadow-xl">
        <CheckCircle2 className="size-5" />
        <div className="flex flex-col">
          <span className="text-sm font-bold">Changes Saved</span>
          <span className="text-[10px] font-medium opacity-90">
            Your merchant settings have been updated.
          </span>
        </div>
      </Alert>
    </div>
  );
}
