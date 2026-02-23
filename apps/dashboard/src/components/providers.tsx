"use client";

import { SessionProvider } from "next-auth/react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAUpdateNotification } from "@/components/pwa-update-notification";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </>
  );
}
