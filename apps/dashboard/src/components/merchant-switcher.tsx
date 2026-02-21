"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Store } from "lucide-react";
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
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function MerchantSwitcher() {
  const { data: session, update } = useSession();
  const [showNewMerchantDialog, setShowNewMerchantDialog] =
    React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newMerchantName, setNewMerchantName] = React.useState("");

  // @ts-expect-error - session user type issues
  const merchants = session?.user?.merchants || [];
  const activeMerchantId = session?.user?.merchantId;
  const activeMerchant = merchants.find(
    (m: { id: string }) => m.id === activeMerchantId,
  ) ||
    merchants[0] || { name: "Select Merchant" };

  const handleCreateMerchant = async () => {
    if (!newMerchantName.trim()) return;

    setIsLoading(true);
    try {
      const newMerchantData = await createMerchant(newMerchantName);
      // Calls update to refresh server session with new merchant ID
      await update({ merchantId: newMerchantData.id });
      window.location.reload();
      setShowNewMerchantDialog(false);
      setNewMerchantName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerchantSwitch = async (merchantId: string) => {
    await update({ merchantId });
    window.location.reload();
  };

  return (
    <Dialog
      open={showNewMerchantDialog}
      onOpenChange={setShowNewMerchantDialog}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shrink-0">
              <Store className="size-4 fill-current" />
            </div>
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
          {merchants.map((merchant: { id: string; name?: string }) => (
            <DropdownMenuItem
              key={merchant.id}
              onSelect={() => handleMerchantSwitch(merchant.id)}
              className="gap-2 p-2 cursor-pointer font-medium text-sm"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Store className="size-4 shrink-0" />
              </div>
              {merchant.name || "Untitled Merchant"}
              {merchant.id === activeMerchantId && (
                <Check className="ml-auto size-4" />
              )}
            </DropdownMenuItem>
          ))}
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
          <div className="space-y-2">
            <Label htmlFor="name">Merchant Name</Label>
            <Input
              id="name"
              placeholder="My New Merchant"
              value={newMerchantName}
              onChange={(e) => setNewMerchantName(e.target.value)}
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
          <Button onClick={handleCreateMerchant} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Merchant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
