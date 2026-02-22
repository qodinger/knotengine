"use client";

export function SettingsHeader() {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Merchant Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your merchant configuration and preferences.
        </p>
      </div>
    </div>
  );
}
