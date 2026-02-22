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
      <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Merchant Project
                </CardTitle>
                <CardDescription className="text-xs">
                  Your merchant&apos;s public identity and identifiers.
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
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Store className="size-3" />
                Business Name
              </span>
              <span className="text-sm font-semibold truncate">
                {formData.businessName || "Not set"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3" />
                Contact Email
              </span>
              <span className="text-sm font-semibold truncate">
                {formData.businessEmail || "Not set"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                <span className="text-xs text-muted-foreground truncate">
                  {formData.logoUrl ? "Logo configured" : "No logo set"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3 border border-border/40 rounded-lg bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Link2 className="size-3" />
                Return URL
              </span>
              <span className="text-sm font-semibold truncate">
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
