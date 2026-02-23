"use client";

export function SettingsHeader() {
  return (
    <div className="border-border/40 flex items-center justify-between border-b pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Merchant Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your merchant configuration and preferences.
        </p>
      </div>
    </div>
  );
}
