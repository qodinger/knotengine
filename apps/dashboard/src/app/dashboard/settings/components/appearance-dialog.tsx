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
  currentPlan?: "starter" | "professional" | "enterprise";
}

export function AppearanceDialog({
  open,
  onOpenChange,
  formData: initialData,
  onSave,
  saving,
  currentPlan = "starter",
}: AppearanceDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid, dirtyFields },
  } = useForm<MerchantSettings>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: {
      ...initialData,
      brandingAlignment: initialData?.brandingAlignment || "left",
    },
    mode: "onChange",
  });

  const theme = watch("theme");
  const brandColor = watch("brandColor");
  const brandingEnabled = watch("brandingEnabled");
  const removeBranding = watch("removeBranding");
  const brandingAlignment = watch("brandingAlignment");

  // Debug: Log form state
  useEffect(() => {
    console.log("📋 Form state:", {
      brandingAlignment,
      theme,
      dirtyFields: Object.keys(dirtyFields),
    });
  }, [brandingAlignment, theme, dirtyFields]);

  useEffect(() => {
    if (open) {
      reset({
        ...initialData,
        brandingAlignment: initialData.brandingAlignment || "left",
      });
    }
  }, [initialData, open, reset]);

  const onSubmit = async (data: MerchantSettings) => {
    console.log("✅ Form submitted with data:", data);
    console.log("📍 brandingAlignment from form:", data.brandingAlignment);

    const dataToSave = {
      ...data,
      brandingAlignment: data.brandingAlignment || "left",
    };

    console.log("💾 Saving to API:", dataToSave);

    await onSave(dataToSave);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 max-h-[90vh] w-full max-w-none overflow-y-auto p-4 sm:w-[95vw] sm:max-w-lg sm:p-6">
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
                    className="bg-background/50 min-w-0 flex-1 font-mono"
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
                      className="border-border/50 ring-offset-background focus-visible:ring-ring size-6 shrink-0 rounded-md border shadow-sm transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* UI Theme */}
                <div className="grid gap-2">
                  <Label htmlFor="theme">UI Theme</Label>
                  <Select
                    value={theme || "system"}
                    onValueChange={(val: "light" | "dark" | "system") =>
                      setValue("theme", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="bg-background/50 w-full">
                      <SelectValue placeholder="System Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="light">Always Light Mode</SelectItem>
                      <SelectItem value="dark">Always Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkout Header Alignment */}
                <div className="grid gap-2">
                  <Label htmlFor="brandingAlignment">Header Alignment</Label>
                  <Select
                    value={brandingAlignment || "left"}
                    onValueChange={(val: "left" | "center") =>
                      setValue("brandingAlignment", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="bg-background/50 w-full">
                      <SelectValue placeholder="Left Aligned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left Aligned</SelectItem>
                      <SelectItem value="center">Center Aligned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show Merchant Header */}
              <div className="border-border/50 bg-muted/20 mt-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Show Merchant Header
                  </Label>
                  <p className="text-muted-foreground mr-4 text-[12px] leading-snug">
                    Display your merchant name and logo at the top of checkout.
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

              {/* Show KnotEngine Footer */}
              <div className="border-border/50 bg-muted/20 mt-2 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    Show &quot;Powered by KnotEngine&quot;
                  </Label>
                  <p className="text-muted-foreground mr-4 text-[12px] leading-snug">
                    Display KnotEngine badge in checkout footer.
                    {currentPlan === "starter" ? (
                      <span className="ml-1 font-semibold text-amber-500">
                        Always shown
                      </span>
                    ) : (
                      <span className="text-primary ml-1 font-semibold">
                        Toggle to hide (Pro+)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={removeBranding !== true}
                    onCheckedChange={(val: boolean) =>
                      setValue("removeBranding", !val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    disabled={currentPlan === "starter" || saving}
                  />
                  {currentPlan === "starter" && (
                    <span className="text-[10px] font-medium text-amber-500">
                      Starter plan
                    </span>
                  )}
                </div>
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
