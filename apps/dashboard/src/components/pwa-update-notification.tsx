"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

export function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Listen for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // When the controller changes, the new service worker has taken control
        window.location.reload();
      });

      // Check for existing waiting service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setNewWorker(registration.waiting);
          setShowUpdate(true);
        }

        // Listen for new waiting service worker
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                registration.waiting
              ) {
                setNewWorker(registration.waiting);
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (newWorker) {
      // Tell the new service worker to skip waiting and take control
      newWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate || !newWorker) return null;

  return (
    <div className="bg-background border-border animate-in slide-in-from-top-2 fixed top-4 right-4 left-4 z-50 rounded-lg border p-4 shadow-lg md:right-4 md:left-auto md:w-96">
      <div className="flex items-start justify-between">
        <div className="mr-4 flex-1">
          <h3 className="text-foreground mb-1 flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            Update Available
          </h3>
          <p className="text-muted-foreground mb-3 text-sm">
            A new version of KnotEngine is available. Update to get the latest
            features and improvements.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Update Now
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Later
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
