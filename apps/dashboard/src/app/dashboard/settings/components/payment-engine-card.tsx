"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Edit2,
  Clock,
  Percent,
  UserCircle,
  Wallet,
  QrCode,
} from "lucide-react";
import { MerchantSettings } from "../types";
import { PaymentEngineDialog } from "./payment-engine-dialog";

interface PaymentEngineCardProps {
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function PaymentEngineCard({
  formData,
  onSave,
  saving,
}: PaymentEngineCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings2 className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Payment Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure how your checkout process behaves.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="size-3.5" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <UserCircle className="size-3" />
                Fee Payer
              </span>
              <span className="text-sm font-semibold capitalize">
                {formData.feeResponsibility === "client"
                  ? "Customer"
                  : "Merchant"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3" />
                Expiration
              </span>
              <span className="text-sm font-semibold">
                {formData.invoiceExpirationMinutes} minutes
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Percent className="size-3" />
                Tolerance
              </span>
              <span className="text-sm font-semibold">
                {formData.underpaymentTolerancePercentage}% underpayment
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <QrCode className="size-3" />
                QR Mode
              </span>
              <span className="text-sm font-semibold">
                {formData.bip21Enabled
                  ? "BIP21 (Amount Included)"
                  : "Standard Address"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 border border-border/40 rounded-lg bg-muted/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Wallet className="size-3" />
              Active Assets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.enabledCurrencies.length > 0 ? (
                formData.enabledCurrencies.map((c) => (
                  <div
                    key={c}
                    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary"
                  >
                    {c}
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  All assets enabled by default
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentEngineDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onSave={onSave}
        saving={saving}
      />
    </>
  );
}
