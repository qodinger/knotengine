"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette } from "lucide-react";
import { merchantSettingsSchema, MerchantSettings } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function AppearanceDialog({
  open,
  onOpenChange,
  formData: initialData,
  onSave,
  saving,
}: AppearanceDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid },
  } = useForm<MerchantSettings>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const theme = watch("theme");
  const brandColor = watch("brandColor");
  const brandingEnabled = watch("brandingEnabled");
  const removeBranding = watch("removeBranding");

  useEffect(() => {
    if (open) {
      reset(initialData);
    }
  }, [initialData, open, reset]);

  const onSubmit = async (data: MerchantSettings) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="text-primary size-5" />
              Customize Appearance
            </DialogTitle>
            <DialogDescription>
              Update your checkout brand colors and themes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brandColor">Brand Color (Hex Code)</Label>

                <div className="flex items-center gap-2">
                  <div className="border-border relative size-8 shrink-0 overflow-hidden rounded-lg border shadow-sm">
                    <input
                      type="color"
                      value={brandColor || "#ffffff"}
                      onChange={(e) =>
                        setValue("brandColor", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="absolute -top-2 -left-2 size-12 cursor-pointer appearance-none border-0 p-0"
                    />
                  </div>
                  <Input
                    id="brandColor"
                    {...register("brandColor")}
                    placeholder="#3b82f6"
                    className="bg-background/50 font-mono"
                    maxLength={7}
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setValue("brandColor", color, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className="border-border/50 ring-offset-background focus-visible:ring-ring size-6 rounded-md border shadow-sm transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="theme">Checkout Theme</Label>
                <Select
                  value={theme || "system"}
                  onValueChange={(val: "light" | "dark" | "system") =>
                    setValue("theme", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="System Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System Default</SelectItem>
                    <SelectItem value="light">Always Light Mode</SelectItem>
                    <SelectItem value="dark">Always Dark Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branding Toggle */}
              <div className="border-border/50 bg-muted/20 mt-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Branding</Label>
                  <p className="text-muted-foreground mr-4 text-[12px] leading-snug">
                    Display your merchant name, logo, and return button at the
                    top of the checkout flow.
                  </p>
                </div>
                <Switch
                  checked={brandingEnabled ?? true}
                  onCheckedChange={(val: boolean) =>
                    setValue("brandingEnabled", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>

              {/* Remove "Powered by KnotEngine" Toggle */}
              <div className="border-border/50 bg-muted/20 mt-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    Remove &quot;Powered by&quot;
                  </Label>
                  <p className="text-muted-foreground mr-4 text-[12px] leading-snug">
                    Hide the KnotEngine badge from your checkout footer.
                    <span className="text-primary ml-1 font-semibold">
                      Pro+
                    </span>
                  </p>
                </div>
                <Switch
                  checked={removeBranding ?? false}
                  onCheckedChange={(val: boolean) =>
                    setValue("removeBranding", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
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
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
