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
      <Card className="bg-card/40 border-border/50 hover:bg-card/60 hover:border-primary/30 group shadow-sm backdrop-blur-md transition-all">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Settings2 className="text-primary size-5" />
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
              className="text-muted-foreground hover:text-foreground h-8 gap-2"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="size-3.5" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <UserCircle className="size-3" />
                Fee Payer
              </span>
              <span className="text-sm font-semibold capitalize">
                {formData.feeResponsibility === "client"
                  ? "Customer"
                  : "Merchant"}
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Clock className="size-3" />
                Expiration
              </span>
              <span className="text-sm font-semibold">
                {formData.invoiceExpirationMinutes} minutes
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Percent className="size-3" />
                Tolerance
              </span>
              <span className="text-sm font-semibold">
                {formData.underpaymentTolerancePercentage}% underpayment
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
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

          <div className="border-border/40 bg-muted/10 flex flex-col gap-2 rounded-lg border p-3">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
              <Wallet className="size-3" />
              Active Assets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {formData.enabledCurrencies.length > 0 ? (
                formData.enabledCurrencies.map((c) => (
                  <div
                    key={c}
                    className="bg-primary/10 border-primary/20 text-primary rounded-md border px-2 py-0.5 text-[10px] font-bold"
                  >
                    {c}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground text-xs italic">
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
