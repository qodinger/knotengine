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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit2, Store, Mail, Link2, ImageIcon } from "lucide-react";
import { MerchantSettings } from "../types";
import { MerchantDetailsDialog } from "./merchant-details-dialog";

interface MerchantDetailsCardProps {
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function MerchantDetailsCard({
  formData,
  onSave,
  saving,
}: MerchantDetailsCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSaveWrapper = async (data: MerchantSettings) => {
    await onSave(data);
  };

  return (
    <>
      <Card className="bg-card/40 border-border/50 hover:bg-card/60 hover:border-primary/30 group shadow-sm backdrop-blur-md transition-all">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Store className="text-primary size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Checkout & Branding
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize your public checkout page identity & logos.
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
              Configure Checkout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Store className="size-3" />
                Business Name
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.businessName || "Not set"}
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Mail className="size-3" />
                Contact Email
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.businessEmail || "Not set"}
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <ImageIcon className="size-3" />
                Merchant Logo
              </span>
              <div className="flex items-center gap-2">
                <Avatar className="size-6 rounded-md">
                  <AvatarImage
                    src={formData.logoUrl}
                    alt={formData.businessName}
                  />
                  <AvatarFallback className="bg-muted text-[10px]">
                    <ImageIcon className="size-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate text-xs">
                  {formData.logoUrl ? "Logo configured" : "No logo set"}
                </span>
              </div>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Link2 className="size-3" />
                Return URL
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.returnUrl || "Not set"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <MerchantDetailsDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onSave={handleSaveWrapper}
        saving={saving}
      />
    </>
  );
}
