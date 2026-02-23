"use client";

import { useRef, useEffect, useState } from "react";
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
import { uploadLogo } from "@/actions/upload";

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
  const [uploading, setUploading] = useState(false);
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
    let finalLogoUrl = data.logoUrl;

    // If it's a new base64 image, upload to Cloudinary first
    if (data.logoUrl?.startsWith("data:image")) {
      setUploading(true);
      try {
        finalLogoUrl = await uploadLogo(data.logoUrl, data.merchantId);
      } finally {
        setUploading(false);
      }
    }

    await onSave({ ...data, logoUrl: finalLogoUrl });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="text-primary size-5" />
              Edit Merchant Details
            </DialogTitle>
            <DialogDescription>
              Update your merchant&apos;s public identity and configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-6">
            {/* Compact Logo Upload Section */}
            <div className="border-border/40 bg-muted/5 flex items-center gap-5 rounded-xl border p-4">
              <div
                className="group relative shrink-0 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="border-border/50 size-16 rounded-xl border shadow-sm transition-opacity group-hover:opacity-80">
                  <AvatarImage
                    src={logoUrl}
                    alt={businessName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground rounded-xl">
                    <Store className="size-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
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

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Merchant Logo</span>
                  <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                    Maximum size: 5MB
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 gap-1.5 px-3 text-[10px]"
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
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 gap-1.5 px-3 text-[10px]"
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
                  <p className="text-destructive text-[10px] font-medium">
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
                  <p className="text-destructive text-[10px] font-medium">
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
            <Button type="submit" disabled={saving || uploading || !isValid}>
              {(saving || uploading) && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {uploading ? "Uploading..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
