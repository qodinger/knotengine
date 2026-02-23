"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Loader2,
  Settings2,
  Clock,
  Percent,
  UserCircle,
  HelpCircle,
  QrCode,
} from "lucide-react";
import { merchantSettingsSchema, MerchantSettings } from "../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { SUPPORTED_CURRENCIES } from "@qodinger/knot-types";

interface PaymentEngineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MerchantSettings;
  onSave: (data: MerchantSettings) => Promise<void>;
  saving: boolean;
}

export function PaymentEngineDialog({
  open,
  onOpenChange,
  formData: initialData,
  onSave,
  saving,
}: PaymentEngineDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<MerchantSettings>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const enabledCurrencies = watch("enabledCurrencies");

  useEffect(() => {
    if (open) {
      reset(initialData);
    }
  }, [initialData, open, reset]);

  const toggleCurrency = (currency: string) => {
    const current = [...enabledCurrencies];
    const index = current.indexOf(currency);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(currency);
    }
    setValue("enabledCurrencies", current, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: MerchantSettings) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="text-primary size-5" />
              Configure Payment Engine
            </DialogTitle>
            <DialogDescription>
              Adjust payment rules and checkout behavior.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Fee Payer */}
            <div className="border-border/40 bg-muted/5 space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <UserCircle className="text-muted-foreground size-4" />
                  Who pays the commission?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="text-muted-foreground size-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Choose whether the platform fee is deducted from your
                      balance (Merchant) or added to the customer&apos;s total
                      (Client).
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Controller
                name="feeResponsibility"
                control={control}
                render={({ field }) => (
                  <Tabs
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="merchant">Merchant (You)</TabsTrigger>
                      <TabsTrigger value="client">
                        Client (Customer)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiration" className="flex items-center gap-2">
                  <Clock className="text-muted-foreground size-4" />
                  Expiration
                </Label>
                <div className="relative">
                  <Input
                    id="expiration"
                    type="number"
                    {...register("invoiceExpirationMinutes", {
                      valueAsNumber: true,
                    })}
                    className="pr-12"
                  />
                  <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold uppercase">
                    Min
                  </div>
                </div>
                {errors.invoiceExpirationMinutes && (
                  <p className="text-destructive text-[10px] font-medium">
                    {errors.invoiceExpirationMinutes.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tolerance" className="flex items-center gap-2">
                  <Percent className="text-muted-foreground size-4" />
                  Tolerance
                </Label>
                <div className="relative">
                  <Input
                    id="tolerance"
                    type="number"
                    step="0.1"
                    {...register("underpaymentTolerancePercentage", {
                      valueAsNumber: true,
                    })}
                    className="pr-8"
                  />
                  <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold">
                    %
                  </div>
                </div>
                {errors.underpaymentTolerancePercentage && (
                  <p className="text-destructive text-[10px] font-medium">
                    {errors.underpaymentTolerancePercentage.message}
                  </p>
                )}
              </div>
            </div>

            {/* BIP21 QR Mode */}
            <div className="border-border/40 bg-muted/5 flex items-center justify-between rounded-xl border p-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <QrCode className="text-muted-foreground size-4" />
                  Premium QR Mode (BIP21)
                </Label>
                <p className="text-muted-foreground text-[10px]">
                  Include amount and label in QR codes for faster wallet
                  recognition.
                </p>
              </div>
              <Controller
                name="bip21Enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Enabled Currencies */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                Enabled Assets (Checkout)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <div
                    key={c}
                    className="border-border/40 hover:bg-muted/10 flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors"
                    onClick={() => toggleCurrency(c)}
                  >
                    <Checkbox
                      id={`cur-${c}`}
                      checked={enabledCurrencies.includes(c)}
                      onCheckedChange={() => toggleCurrency(c)}
                    />
                    <Label
                      htmlFor={`cur-${c}`}
                      className="cursor-pointer text-xs"
                    >
                      {c.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.enabledCurrencies && (
                <p className="text-destructive text-[10px] font-medium">
                  {errors.enabledCurrencies.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !isValid || enabledCurrencies.length === 0}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Engine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
