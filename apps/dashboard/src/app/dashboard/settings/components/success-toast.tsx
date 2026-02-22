"use client";

import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";

interface SuccessToastProps {
  show: boolean;
}

export function SuccessToast({ show }: SuccessToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 z-50">
      <Alert className="bg-emerald-500 text-white border-none shadow-xl flex items-center gap-3 pr-8">
        <CheckCircle2 className="size-5" />
        <div className="flex flex-col">
          <span className="font-bold text-sm">Changes Saved</span>
          <span className="text-[10px] opacity-90 font-medium">
            Your merchant settings have been updated.
          </span>
        </div>
      </Alert>
    </div>
  );
}
