"use client";

import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, Upload, Trash2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { merchantSettingsSchema, MerchantSettings } from "../types";

interface MerchantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function MerchantDetailsDialog({
  open,
  onOpenChange,
  formData: initialData,
  onSave,
  saving,
}: MerchantDetailsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<MerchantSettings>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const logoUrl = watch("logoUrl");
  const businessName = watch("businessName");

  useEffect(() => {
    if (open) {
      reset(initialData);
    }
  }, [initialData, open, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("logoUrl", reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setValue("logoUrl", "", { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: MerchantSettings) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/50">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="size-5 text-primary" />
              Edit Merchant Details
            </DialogTitle>
            <DialogDescription>
              Update your merchant&apos;s public identity and configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-6">
            {/* Compact Logo Upload Section */}
            <div className="flex items-center gap-5 p-4 border border-border/40 rounded-xl bg-muted/5">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="size-16 rounded-xl border border-border/50 shadow-sm group-hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={logoUrl}
                    alt={businessName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground rounded-xl">
                    <Store className="size-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                  <Camera className="size-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Merchant Logo</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Maximum size: 5MB
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[10px] gap-1.5 px-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3" />
                    Upload Image
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1.5 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={removeLogo}
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="businessName">Merchant Name</Label>
                <Input
                  id="businessName"
                  {...register("businessName")}
                  placeholder="My Awesome Merchant"
                  className={cn(
                    "bg-background/50",
                    errors.businessName &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {errors.businessName && (
                  <p className="text-[10px] font-medium text-destructive">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  {...register("businessEmail")}
                  placeholder="hello@yourmerchant.com"
                  className={cn(
                    "bg-background/50",
                    errors.businessEmail &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {errors.businessEmail && (
                  <p className="text-[10px] font-medium text-destructive">
                    {errors.businessEmail.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="returnUrl">Checkout Return URL</Label>
                <Input
                  id="returnUrl"
                  {...register("returnUrl", {
                    onBlur: (e) => {
                      const val = e.target.value.trim();
                      if (
                        val &&
                        !val.startsWith("http://") &&
                        !val.startsWith("https://") &&
                        !val.startsWith("/")
                      ) {
                        setValue("returnUrl", `https://${val}`, {
                          shouldDirty: true,
                        });
                      }
                    },
                  })}
                  placeholder="https://yourmerchant.com/checkout/success"
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !isValid}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
