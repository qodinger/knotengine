"use client";

import { useState, useRef, ChangeEvent } from "react";
import { PlusCircle, Loader2, Camera } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createMerchant } from "@/actions/merchant";
import { uploadLogo } from "@/actions/upload";

export default function OnboardingPage() {
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [merchantName, setMerchantName] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "done"
  >("idle");

  const handleCreate = async () => {
    if (!merchantName.trim()) return;

    setIsLoading(true);
    try {
      let logoUrl: string | undefined;

      // Step 1: Upload image to Cloudinary if one was selected
      if (logoBase64) {
        setUploadStatus("uploading");
        logoUrl = await uploadLogo(logoBase64);
        setUploadStatus("done");
      }

      // Step 2: Create merchant with the Cloudinary URL
      const newMerchant = await createMerchant(merchantName, logoUrl);
      await update({ merchantId: newMerchant.id });
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to create merchant:", error);
      setUploadStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const nameInitial = merchantName
    ? merchantName.substring(0, 1).toUpperCase()
    : "M";

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4">
      <Card className="bg-background/50 border-border/40 w-full max-w-md shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your merchant
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            Set up your brand identity to start accepting crypto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 py-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              onClick={handleAvatarClick}
              className="group relative cursor-pointer"
            >
              <Avatar className="border-border/40 hover:border-primary/40 ring-offset-background ring-primary/20 h-28 w-28 border-2 transition-all duration-200 group-hover:ring-2">
                <AvatarImage
                  src={logoBase64}
                  alt={merchantName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-3xl font-bold">
                  {nameInitial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
              Merchant Logo
            </p>
          </div>

          {/* Name Input Section */}
          <div className="space-y-2">
            <Label
              htmlFor="merchant"
              className="text-muted-foreground/80 ml-1 text-[11px] font-bold tracking-wider uppercase"
            >
              Legal Business Name
            </Label>
            <Input
              id="merchant"
              placeholder="e.g. Acme Payments Ltd."
              className="bg-background/50 border-border/40 focus:ring-primary/40 h-11"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            onClick={handleCreate}
            className="shadow-primary/10 h-11! w-full cursor-pointer gap-2 text-xs font-bold tracking-widest uppercase shadow-lg transition-all"
            disabled={!merchantName.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadStatus === "uploading"
                  ? "Uploading Logo..."
                  : "Launching..."}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Activate Merchant
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
