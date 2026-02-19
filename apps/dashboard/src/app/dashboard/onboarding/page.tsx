"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMerchant } from "@/actions/merchant";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!storeName.trim()) return;

    setIsLoading(true);
    try {
      // 1. Create the store via Server Action
      const newMerchant = await createMerchant(storeName);

      // 2. Update session to set this as the active store
      await update({ merchantId: newMerchant.id });

      // 3. Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Failed to create store:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-none shadow-lg bg-background/50 border">
        <CardHeader>
          <CardTitle className="text-xl">Create your first store</CardTitle>
          <CardDescription>
            Welcome to KnotEngine. To get started, please create a store to
            manage your payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Store Name</Label>
            <Input
              id="project"
              placeholder="My Awesome Store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={!storeName.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Store
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
