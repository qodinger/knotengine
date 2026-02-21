"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantSettings } from "../types";

interface MerchantDetailsCardProps {
  formData: MerchantSettings;
  setFormData: (data: MerchantSettings) => void;
}

export function MerchantDetailsCard({
  formData,
  setFormData,
}: MerchantDetailsCardProps) {
  return (
    <Card className="bg-linear-to-br from-card to-card/50 border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Merchant Details</CardTitle>
        <CardDescription>
          Your merchant&apos;s public identity and unique identifiers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="merchantName">Merchant Name</Label>
          <Input
            id="merchantName"
            value={formData.businessName}
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
            placeholder="My Awesome Merchant"
            className="bg-background/50"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="logoUrl">Merchant Logo URL</Label>
          <Input
            id="logoUrl"
            value={formData.logoUrl}
            onChange={(e) =>
              setFormData({ ...formData, logoUrl: e.target.value })
            }
            placeholder="https://yourmerchant.com/logo.png"
            className="bg-background/50"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="returnUrl">Checkout Return URL</Label>
          <Input
            id="returnUrl"
            value={formData.returnUrl}
            onChange={(e) =>
              setFormData({ ...formData, returnUrl: e.target.value })
            }
            placeholder="https://yourmerchant.com/checkout/success"
            className="bg-background/50"
          />
        </div>
      </CardContent>
    </Card>
  );
}
