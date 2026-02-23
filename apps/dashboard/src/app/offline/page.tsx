"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <WifiOff className="text-muted-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">You&apos;re offline</CardTitle>
          <CardDescription>
            It looks like you&apos;ve lost your internet connection. Some
            features may not be available until you&apos;re back online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="mb-2 font-semibold">
              What&apos;s available offline:
            </h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• Previously loaded pages</li>
              <li>• Cached dashboard data</li>
              <li>• App navigation</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Your data will sync automatically when you&apos;re back online.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
