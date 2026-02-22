"use client";

import { useState } from "react";
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
  const { update } = useSession();
  const [merchantName, setMerchantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!merchantName.trim()) return;

    setIsLoading(true);
    try {
      // 1. Create the merchant via Server Action
      const newMerchant = await createMerchant(merchantName);

      // 2. Update session to set this as the active merchant
      await update({ merchantId: newMerchant.id });

      // 3. Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to create merchant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-none shadow-lg bg-background/50 border">
        <CardHeader>
          <CardTitle className="text-xl">Create your first merchant</CardTitle>
          <CardDescription>
            Welcome to KnotEngine. To get started, please create a merchant to
            manage your payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant Name</Label>
            <Input
              id="merchant"
              placeholder="My Awesome Merchant"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={!merchantName.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Merchant
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
