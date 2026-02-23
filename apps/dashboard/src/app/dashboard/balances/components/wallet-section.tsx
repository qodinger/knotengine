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
        <h2 className="text-foreground text-sm font-semibold">
          Settlement Wallets
        </h2>
        <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-2 text-xs">
              <Plus className="size-3" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25">
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
                    className="bg-background/50 border-border/80 h-11 w-full pr-10 font-mono text-sm"
                    placeholder="Paste your address here..."
                    value={newWalletAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    autoComplete="off"
                  />
                  {newWalletAddress && (
                    <div className="animate-in fade-in zoom-in absolute top-1/2 right-3 -translate-y-1/2 text-emerald-500 duration-300">
                      <Wand2 className="size-4" />
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                  <Wand2 className="size-2.5 opacity-50" />
                  Tip: Paste your wallet to auto-detect the network.
                </p>
              </div>

              <div className="grid gap-4">
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
                      className="bg-background/50 border-border/80 h-11! w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="[&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
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
                            className="h-10"
                          >
                            <Avatar className="size-5 h-6! bg-transparent p-0">
                              <AvatarImage
                                src={asset.icon}
                                className="object-contain"
                              />
                              <AvatarFallback className="bg-slate-500 text-[10px] text-white">
                                {asset.symbol}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground text-sm font-bold">
                                {asset.symbol}
                              </span>
                              <span className="text-muted-foreground truncate text-xs font-normal">
                                {asset.label}
                              </span>
                            </div>
                            {isLocked && (
                              <span className="text-muted-foreground ml-auto text-[9px] opacity-50">
                                (Incompatible)
                              </span>
                            )}
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
                      className="bg-background/50 border-border/80 h-11! w-full disabled:opacity-40"
                    >
                      <SelectValue placeholder="Network" />
                    </SelectTrigger>
                    <SelectContent>
                      {newWalletCoin &&
                        configNetworks[newWalletCoin]?.map((network) => (
                          <SelectItem
                            key={network.id}
                            value={network.id}
                            className="h-auto w-full py-2"
                          >
                            <div className="flex w-full items-center gap-2">
                              <span className="text-foreground text-sm font-bold">
                                {network.networkSymbol}
                              </span>
                              <span className="text-muted-foreground truncate text-[11px] font-normal">
                                {network.networkName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(() => {
                if (
                  !newWalletNetwork ||
                  !newWalletCoin ||
                  !merchant ||
                  !newWalletAddress.trim()
                )
                  return null;
                const selectedNet = configNetworks[newWalletCoin]?.find(
                  (n) => n.id === newWalletNetwork,
                );
                if (!selectedNet) return null;

                const currentSavedValue = merchant[
                  selectedNet.merchantField
                ] as string | null | undefined;
                const inputMatchesSaved =
                  currentSavedValue &&
                  currentSavedValue === newWalletAddress.trim();

                // Only show smart match if they actually match the saved value
                if (!inputMatchesSaved) return null;

                const siblings = Object.values(configNetworks)
                  .flat()
                  .filter(
                    (n) =>
                      n.id !== selectedNet.id &&
                      n.merchantField === selectedNet.merchantField &&
                      merchant.enabledCurrencies.includes(n.id),
                  );

                if (siblings.length === 0) return null;

                const isXpub = selectedNet.merchantField === "btcXpub";

                return (
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <p className="text-[10.5px] leading-relaxed font-medium text-emerald-600">
                      Smart Match: This network shares the same{" "}
                      {isXpub ? "master key (xPub)" : "address"} as your{" "}
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
                className="h-10 text-[10px] font-bold tracking-widest uppercase"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWallet}
                className="h-10 text-[10px] font-bold tracking-widest uppercase"
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
                      ? (merchant[field] as string | null | undefined)
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
                    field && merchant
                      ? (merchant[field] as string | null | undefined)
                      : undefined;
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
        <Card className="border-border/40 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Wallet className="text-muted-foreground/20 mb-3 size-8" />
            <p className="text-muted-foreground/60 mb-1 text-sm font-medium">
              No wallets configured
            </p>
            <p className="text-muted-foreground/40 mb-4 max-w-xs text-xs">
              Add your BTC xPub or ETH address to receive non-custodial
              payments.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddWalletOpen(true)}
            >
              <Plus className="mr-2 size-3" />
              Add Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-card flex flex-col justify-between gap-4 rounded-xl border p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-10 shrink-0 bg-transparent p-0">
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
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {wallet.label}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {wallet.network}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-muted-foreground text-xs whitespace-nowrap">
                      {wallet.type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border-border/30 flex w-full shrink-0 items-center gap-2 rounded-lg border p-2 sm:w-auto">
                <code className="text-muted-foreground flex-1 truncate px-1 font-mono text-xs sm:max-w-xs">
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
                  className="text-muted-foreground size-7 shrink-0 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  onClick={() => setWalletToRemove(wallet.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!walletToRemove}
        onOpenChange={(open) => !open && setWalletToRemove(null)}
      >
        <DialogContent className="sm:max-w-106.25">
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

      <div className="text-muted-foreground flex items-center gap-2 px-1 text-xs">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
        <span>
          Non-custodial — all payments settle directly to your wallets.
        </span>
      </div>
    </div>
  );
}
