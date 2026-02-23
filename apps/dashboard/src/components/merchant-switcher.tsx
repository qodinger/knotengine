"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Store, Camera } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMerchant } from "@/actions/merchant";
import { uploadLogo } from "@/actions/upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function MerchantSwitcher() {
  const { data: session, update } = useSession();
  const [showNewMerchantDialog, setShowNewMerchantDialog] =
    React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newMerchantName, setNewMerchantName] = React.useState("");
  const [logoBase64, setLogoBase64] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [detailedMerchants, setDetailedMerchants] = React.useState<
    Array<{ _id: string; name: string; logoUrl?: string }>
  >([]);

  // @ts-expect-error - session user type issues
  const sessionMerchants = session?.user?.merchants || [];
  const activeMerchantId = session?.user?.merchantId;

  // Fetch full merchant details (with logos) on mount
  React.useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await fetch("/api/v1/merchants");
        if (res.ok) {
          const data = await res.json();
          setDetailedMerchants(data);
        }
      } catch (err) {
        console.error("Failed to fetch merchants with logos", err);
      }
    };
    if (session?.user) fetchMerchants();
  }, [session?.user]);

  // Use detailed data if available, otherwise session data
  const merchants =
    detailedMerchants.length > 0 ? detailedMerchants : sessionMerchants;

  const activeMerchant = merchants.find(
    (m: { id: string }) => m.id === activeMerchantId,
  ) ||
    merchants[0] || { name: "Select Merchant" };

  const handleCreateMerchant = async () => {
    if (!newMerchantName.trim()) return;

    setIsLoading(true);
    try {
      let logoUrl: string | undefined;

      // Upload logo to Cloudinary first if one was selected
      if (logoBase64) {
        logoUrl = await uploadLogo(logoBase64);
      }

      const newMerchantData = await createMerchant(newMerchantName, logoUrl);
      // Calls update to refresh server session with new merchant ID
      await update({ merchantId: newMerchantData.id });
      window.location.reload();
      setShowNewMerchantDialog(false);
      setNewMerchantName("");
      setLogoBase64("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMerchantSwitch = async (merchantId: string) => {
    await update({ merchantId });
    window.location.reload();
  };

  return (
    <Dialog
      open={showNewMerchantDialog}
      onOpenChange={(open) => {
        setShowNewMerchantDialog(open);
        if (!open) {
          setLogoBase64("");
          setNewMerchantName("");
        }
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <Avatar className="size-8 rounded-md border border-white/10 shrink-0">
              <AvatarImage
                src={activeMerchant.logoUrl}
                alt={activeMerchant.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground rounded-md shadow-sm text-xs font-bold">
                {activeMerchant.name?.[0]?.toUpperCase() || (
                  <Store className="size-4 fill-current" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden ml-3 overflow-hidden text-left flex-1">
              <span className="font-bold text-sm tracking-tight leading-none text-foreground truncate">
                {activeMerchant.name || "Untitled Merchant"}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-bold tracking-widest leading-none mt-0.5 truncate uppercase">
                Merchant
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest font-bold px-2 py-1.5">
            Merchants
          </DropdownMenuLabel>
          {merchants.map(
            (merchant: { id: string; name?: string; logoUrl?: string }) => (
              <DropdownMenuItem
                key={merchant.id}
                onSelect={() => handleMerchantSwitch(merchant.id)}
                className="gap-2 p-2 cursor-pointer font-medium text-sm"
              >
                <Avatar className="size-6 rounded-sm border shrink-0">
                  <AvatarImage
                    src={merchant.logoUrl}
                    alt={merchant.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-[10px] font-bold bg-muted">
                    {merchant.name?.[0]?.toUpperCase() || (
                      <Store className="size-3" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {merchant.name || "Untitled Merchant"}
                {merchant.id === activeMerchantId && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ),
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 p-2 cursor-pointer font-medium text-sm"
            onSelect={() => setShowNewMerchantDialog(true)}
          >
            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <PlusCircle className="size-4" />
            </div>
            Create Merchant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Merchant</DialogTitle>
          <DialogDescription>
            Add a new merchant to manage separate billing and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <Avatar className="h-20 w-20 border-2 border-border/40 transition-all duration-200 group-hover:border-primary/40">
                <AvatarImage src={logoBase64} className="object-cover" />
                <AvatarFallback className="bg-muted">
                  <Camera className="size-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                <PlusCircle className="size-5 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Merchant Logo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Merchant Name</Label>
            <Input
              id="name"
              placeholder="My New Merchant"
              value={newMerchantName}
              onChange={(e) => setNewMerchantName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowNewMerchantDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateMerchant}
            disabled={isLoading || !newMerchantName.trim()}
          >
            {isLoading ? "Creating..." : "Create Merchant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
