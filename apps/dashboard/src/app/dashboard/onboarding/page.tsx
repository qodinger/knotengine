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
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <Card className="w-full max-w-md bg-background/50 backdrop-blur-sm border-border/40 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your merchant
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Set up your brand identity to start accepting crypto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 py-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              onClick={handleAvatarClick}
              className="relative group cursor-pointer"
            >
              <Avatar className="h-28 w-28 border-2 border-border/40 transition-all duration-200 hover:border-primary/40 ring-offset-background group-hover:ring-2 ring-primary/20">
                <AvatarImage
                  src={logoBase64}
                  alt={merchantName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-3xl font-bold">
                  {nameInitial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Merchant Logo
            </p>
          </div>

          {/* Name Input Section */}
          <div className="space-y-2">
            <Label
              htmlFor="merchant"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1"
            >
              Legal Business Name
            </Label>
            <Input
              id="merchant"
              placeholder="e.g. Acme Payments Ltd."
              className="h-11 bg-background/50 border-border/40 focus:ring-primary/40"
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
            className="w-full h-11! gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/10 transition-all cursor-pointer"
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
