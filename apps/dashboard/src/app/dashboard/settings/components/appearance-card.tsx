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
import { Edit2, Palette, SunMoon } from "lucide-react";
import { MerchantSettings } from "../types";
import { AppearanceDialog } from "./appearance-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppearanceCardProps {
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function AppearanceCard({
  formData,
  onSave,
  saving,
}: AppearanceCardProps) {
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
                <Palette className="text-primary size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Appearance
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize the look and feel of your checkout page.
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
              Customize
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <Palette className="size-3" />
                Brand Color
              </span>
              <div className="mt-1 flex items-center gap-2">
                <div className="border-border relative size-6 shrink-0 overflow-hidden rounded-full border shadow-sm">
                  <input
                    key={formData.brandColor}
                    type="color"
                    defaultValue={formData.brandColor || "#ffffff"}
                    onBlur={(e) => {
                      if (e.target.value !== formData.brandColor) {
                        handleSaveWrapper({
                          ...formData,
                          brandColor: e.target.value,
                        });
                      }
                    }}
                    disabled={saving}
                    className="absolute -top-2 -left-2 size-10 cursor-pointer appearance-none border-0 p-0"
                    title="Choose brand color"
                  />
                </div>
                <span className="font-mono text-sm font-semibold uppercase">
                  {formData.brandColor || "#ffffff"}
                </span>
              </div>
            </div>

            <div className="border-border/40 bg-muted/10 flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <SunMoon className="size-3" />
                UI Theme
              </span>
              <Select
                value={formData.theme || "system"}
                onValueChange={(val: "light" | "dark" | "system") =>
                  handleSaveWrapper({ ...formData, theme: val })
                }
                disabled={saving}
              >
                <SelectTrigger className="bg-background/50 mt-1 h-8 text-xs font-semibold">
                  <SelectValue placeholder="System Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Always Light Mode</SelectItem>
                  <SelectItem value="dark">Always Dark Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-border/40 bg-muted/10 flex items-center justify-between rounded-lg border p-3">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
              Show Branding
            </span>
            <span className="text-xs font-medium">
              {(formData.brandingEnabled ?? true) ? "Enabled" : "Disabled"}
            </span>
          </div>
        </CardContent>
      </Card>

      <AppearanceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onSave={handleSaveWrapper}
        saving={saving}
      />
    </>
  );
}
