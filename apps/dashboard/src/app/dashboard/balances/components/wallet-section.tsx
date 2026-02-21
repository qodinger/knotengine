"use client";

import {
  Wallet,
  Copy,
  Check,
  ShieldCheck,
  Plus,
  Loader2,
  Trash2,
  Wand2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NetworkInfo } from "@qodinger/knot-types";
import { MerchantProfile, WalletInfo, ConfigAsset } from "../types";

interface WalletSectionProps {
  merchant: MerchantProfile | null;
  wallets: WalletInfo[];
  configAssets: ConfigAsset[];
  configNetworks: Record<string, NetworkInfo[]>;
  copiedField: string | null;
  isAddWalletOpen: boolean;
  setIsAddWalletOpen: (open: boolean) => void;
  newWalletAddress: string;
  newWalletCoin: string;
  setNewWalletCoin: (coin: string) => void;
  newWalletNetwork: string;
  setNewWalletNetwork: (net: string) => void;
  isAddingWallet: boolean;
  handleAddressChange: (val: string) => void;
  handleAddWallet: () => void;
  walletToRemove: string | null;
  setWalletToRemove: (id: string | null) => void;
  isRemovingWallet: boolean;
  handleRemoveWallet: () => void;
  copyAddress: (value: string, field: string) => void;
}

export function WalletSection({
  merchant,
  wallets,
  configAssets,
  configNetworks,
  copiedField,
  isAddWalletOpen,
  setIsAddWalletOpen,
  newWalletAddress,
  newWalletCoin,
  setNewWalletCoin,
  newWalletNetwork,
  setNewWalletNetwork,
  isAddingWallet,
  handleAddressChange,
  handleAddWallet,
  walletToRemove,
  setWalletToRemove,
  isRemovingWallet,
  handleRemoveWallet,
  copyAddress,
}: WalletSectionProps) {
  const truncate = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Settlement Wallets
        </h2>
        <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-2">
              <Plus className="size-3" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Settlement Wallet</DialogTitle>
              <DialogDescription>
                Configure a new wallet to receive your settlements.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Wallet Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    className="w-full pr-10 font-mono text-sm h-11 bg-background/50 border-border/80"
                    placeholder="Paste your address here..."
                    value={newWalletAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    autoComplete="off"
                  />
                  {newWalletAddress && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in fade-in zoom-in duration-300">
                      <Wand2 className="size-4" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Wand2 className="size-2.5 opacity-50" />
                  Tip: Paste your wallet to auto-detect the network.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="coin">Coin</Label>
                  <Select
                    value={newWalletCoin}
                    onValueChange={(val) => {
                      setNewWalletCoin(val);
                      setNewWalletNetwork("");
                    }}
                  >
                    <SelectTrigger
                      id="coin"
                      className="w-full h-10! bg-background/50 border-border/80"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {configAssets.map((asset) => {
                        const input = newWalletAddress.trim();
                        let isLocked = false;

                        if (input) {
                          const isXpub = /^[xyzvtu]pub/i.test(input);
                          const isBtcAddr = /^(1|3|bc1q|bc1p)/i.test(input);
                          const isLtcAddr = /^(L|M|ltc1)/i.test(input);
                          const isEvmAddr = /^0x/i.test(input);

                          if (isXpub || isBtcAddr) {
                            isLocked = !["BTC", "LTC"].includes(asset.id);
                          } else if (isLtcAddr) {
                            isLocked = asset.id !== "LTC";
                          } else if (isEvmAddr) {
                            isLocked = !["ETH", "USDT"].includes(asset.id);
                          }
                        }

                        return (
                          <SelectItem
                            key={asset.id}
                            value={asset.id}
                            disabled={isLocked}
                            className="h-10!"
                          >
                            <div className="flex items-center gap-2">
                              <span>{asset.label}</span>
                              {isLocked && (
                                <span className="text-[9px] text-muted-foreground ml-auto opacity-50">
                                  (Incompatible)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="network">Network</Label>
                  <Select
                    value={newWalletNetwork}
                    onValueChange={setNewWalletNetwork}
                    disabled={!newWalletCoin}
                  >
                    <SelectTrigger
                      id="network"
                      className="w-full h-10! bg-background/50 border-border/80 disabled:opacity-40"
                    >
                      <SelectValue placeholder="Network" />
                    </SelectTrigger>
                    <SelectContent>
                      {newWalletCoin &&
                        configNetworks[newWalletCoin]?.map((network) => (
                          <SelectItem
                            key={network.id}
                            value={network.id}
                            className="h-10!"
                          >
                            {network.networkName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(() => {
                // Show a hint when the selected network shares the same address with another network
                if (!newWalletNetwork || !newWalletCoin) return null;
                const selectedNet = configNetworks[newWalletCoin]?.find(
                  (n) => n.id === newWalletNetwork,
                );
                if (!selectedNet) return null;

                // Find other networks that share the same merchantField
                const siblings = Object.values(configNetworks)
                  .flat()
                  .filter(
                    (n) =>
                      n.id !== selectedNet.id &&
                      n.merchantField === selectedNet.merchantField,
                  );

                if (siblings.length === 0) return null;

                return (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-emerald-600 font-medium leading-relaxed">
                      Smart Match: This network shares the same address as your{" "}
                      {siblings.map((s) => s.label).join(", ")} wallet.
                    </p>
                  </div>
                );
              })()}
            </div>
            <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0">
              <Button
                variant="outline"
                onClick={() => setIsAddWalletOpen(false)}
                className="h-10 font-bold uppercase text-[10px] tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWallet}
                className="h-10 font-bold uppercase text-[10px] tracking-widest"
                disabled={
                  isAddingWallet ||
                  !newWalletAddress ||
                  !newWalletNetwork ||
                  (() => {
                    if (!newWalletNetwork || !merchant) return false;
                    // Find the merchantField for this network dynamically
                    let field = "";
                    Object.values(configNetworks).forEach((nets) => {
                      const match = nets.find((n) => n.id === newWalletNetwork);
                      if (match) field = match.merchantField;
                    });
                    const currentSaved = field
                      ? (merchant as any)[field]
                      : undefined;
                    return (
                      currentSaved === newWalletAddress.trim() &&
                      merchant.enabledCurrencies.includes(newWalletNetwork)
                    );
                  })()
                }
              >
                {isAddingWallet ? (
                  <Loader2 className="mr-2 size-3 animate-spin" />
                ) : (
                  <Save className="mr-2 size-3" />
                )}
                {(() => {
                  const isAlreadyEnabled =
                    merchant?.enabledCurrencies.includes(newWalletNetwork);
                  let field = "";
                  Object.values(configNetworks).forEach((nets) => {
                    const match = nets.find((n) => n.id === newWalletNetwork);
                    if (match) field = match.merchantField;
                  });
                  const currentSaved =
                    field && merchant ? (merchant as any)[field] : undefined;
                  const isSameAddress =
                    currentSaved === newWalletAddress.trim();

                  if (isAlreadyEnabled && isSameAddress)
                    return "Already Configured";
                  if (isAlreadyEnabled && !isSameAddress)
                    return "Update Wallet";
                  return "Confirm Wallet";
                })()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {wallets.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Wallet className="size-8 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/60 mb-1">
              No wallets configured
            </p>
            <p className="text-xs text-muted-foreground/40 max-w-xs mb-4">
              Add your BTC xPub or ETH address to receive non-custodial
              payments.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddWalletOpen(true)}
            >
              <Plus className="size-3 mr-2" />
              Add Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <div className="divide-y divide-border/40">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="size-10 bg-transparent p-0 shrink-0">
                    <AvatarImage
                      src={wallet.iconUrl}
                      className="object-contain"
                    />
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-bold text-white",
                        wallet.iconColor,
                      )}
                    >
                      {wallet.iconFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {wallet.label}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium"
                      >
                        {wallet.network}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {wallet.type}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-muted/30 p-2 rounded-lg border border-border/30 w-full sm:w-auto">
                  <code className="text-xs font-mono text-muted-foreground truncate flex-1 sm:max-w-xs px-1">
                    {truncate(wallet.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => copyAddress(wallet.address, wallet.id)}
                  >
                    {copiedField === wallet.id ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    onClick={() => setWalletToRemove(wallet.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog
        open={!!walletToRemove}
        onOpenChange={(open) => !open && setWalletToRemove(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Settlement Wallet?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this wallet? Any active
              transactions or pending payouts might be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setWalletToRemove(null)}
              disabled={isRemovingWallet}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveWallet}
              disabled={isRemovingWallet}
            >
              {isRemovingWallet && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Remove Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
        <span>
          Non-custodial — all payments settle directly to your wallets.
        </span>
      </div>
    </div>
  );
}
