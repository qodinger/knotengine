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
import { cn } from "@/lib/utils";

interface MerchantDetailsCardProps {
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
  currentPlan?: "starter" | "professional" | "enterprise";
}

export function MerchantDetailsCard({
  formData,
  onSave,
  saving,
  currentPlan = "starter",
}: MerchantDetailsCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSaveWrapper = async (data: MerchantSettings) => {
    await onSave(data);
  };

  return (
    <>
      <Card className="bg-card/40 border-border/50 hover:bg-card/60 hover:border-primary/30 group shadow-sm backdrop-blur-md transition-all">
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Store className="text-primary size-4 sm:size-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">
                  Merchant Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage your business identity and checkout logos.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 sm:h-8 sm:gap-2 sm:px-3"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline">Configure</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
            <div className="border-border/40 bg-muted/10 flex min-w-0 flex-col gap-1.5 rounded-lg border p-2 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                <Store className="size-2.5 sm:size-3" />
                Business Name
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.businessName || "Not set"}
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex min-w-0 flex-col gap-1.5 rounded-lg border p-2 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                <Mail className="size-2.5 sm:size-3" />
                Contact Email
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.businessEmail || "Not set"}
              </span>
            </div>

            <div className="border-border/40 bg-muted/10 flex min-w-0 flex-col gap-1.5 rounded-lg border p-2 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                <ImageIcon className="size-2.5 sm:size-3" />
                Merchant Logo
              </span>
              <div className="flex items-center gap-2">
                <Avatar className="border-border/50 size-5 rounded-md border sm:size-6">
                  <AvatarImage
                    src={formData.logoUrl}
                    alt={formData.businessName}
                  />
                  <AvatarFallback className="bg-muted text-[10px]">
                    <ImageIcon className="size-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate text-xs">
                  {formData.logoUrl ? "Logo set" : "No logo uploaded"}
                </span>
              </div>
            </div>

            <div className="border-border/40 bg-muted/10 flex min-w-0 flex-col gap-1.5 rounded-lg border p-2 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                <Link2 className="size-2.5 sm:size-3" />
                Return URL
              </span>
              <span className="truncate text-sm font-semibold">
                {formData.returnUrl || "Not set"}
              </span>
            </div>
          </div>

          {/* Plan Badge */}
          <div className="border-border/40 bg-muted/10 flex items-center justify-between rounded-lg border p-2 sm:p-3">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
              <Store className="size-2.5 sm:size-3" />
              Subscription Plan
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                  currentPlan === "starter" &&
                    "bg-secondary text-secondary-foreground",
                  currentPlan === "professional" &&
                    "bg-primary text-primary-foreground",
                  currentPlan === "enterprise" &&
                    "bg-purple-500/20 text-purple-400",
                )}
              >
                {currentPlan}
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
