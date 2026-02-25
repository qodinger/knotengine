"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useServiceWorker() {
  const isSupported = false; // Disable service worker to prevent caching issues
  const [isRegistered, setIsRegistered] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Unregister any existing service workers that might be causing ERR_FAILED
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    if (!isSupported) return;

    // Check if service worker is accessible before registering
    fetch("/api/sw", { method: "HEAD" })
      .then((response) => {
        if (!response.ok) {
          console.warn("Service worker API endpoint not available");
          return;
        }

        // Register service worker using API endpoint
        navigator.serviceWorker
          .register("/api/sw", { scope: "/" })
          .then((registration) => {
            console.log("Service Worker registered:", registration);
            setIsRegistered(true);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New version available
                    if (confirm("New version available! Reload to update?")) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
            // Don't show error to user, just log it
          });
      })
      .catch((error) => {
        console.error("Failed to check service worker availability:", error);
      });

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, [isSupported]);

  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Install prompt failed:", error);
      return false;
    }
  };

  return {
    isSupported,
    isRegistered,
    canInstall,
    installApp,
  };
}
