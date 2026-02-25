"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { useServiceWorker } from "@/hooks/use-service-worker";

export function PWAInstallPrompt() {
  const { canInstall, installApp } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after 3 seconds if installable and not dismissed
    if (canInstall && !dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  if (!isVisible || !canInstall) return null;

  return (
    <div className="bg-background border-border animate-in slide-in-from-bottom-2 fixed right-4 bottom-4 left-4 z-50 rounded-lg border p-4 shadow-lg md:right-4 md:left-auto md:w-96">
      <div className="flex items-start justify-between">
        <div className="mr-4 flex-1">
          <h3 className="text-foreground mb-1 font-semibold">
            Install KnotEngine
          </h3>
          <p className="text-muted-foreground mb-3 text-sm">
            Install our app for a better experience with offline access and push
            notifications.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Install
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
