"use client";

import { SessionProvider } from "next-auth/react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAUpdateNotification } from "@/components/pwa-update-notification";
import { Toaster } from "sonner";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <Toaster position="top-right" richColors closeButton theme="dark" />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </>
  );
}
