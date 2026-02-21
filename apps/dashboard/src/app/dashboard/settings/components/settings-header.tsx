"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  handleSave: () => void;
  saving: boolean;
  loading: boolean;
  success: boolean;
}

export function SettingsHeader({
  handleSave,
  saving,
  loading,
  success,
}: SettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Merchant Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your merchant configuration and preferences.
        </p>
      </div>
      <Button
        onClick={handleSave}
        disabled={saving || loading}
        className="font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg hover:shadow-primary/20 transition-all"
      >
        {saving ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Save className="size-3" />
        )}
        {success ? "Saved" : "Save Changes"}
      </Button>
    </div>
  );
}
