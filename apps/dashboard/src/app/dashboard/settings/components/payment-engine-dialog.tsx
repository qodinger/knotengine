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
      <DialogContent className="sm:max-w-[500px] border-border/50">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="size-5 text-primary" />
              Configure Payment Engine
            </DialogTitle>
            <DialogDescription>
              Adjust payment rules and checkout behavior.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Fee Payer */}
            <div className="space-y-3 p-4 border border-border/40 rounded-xl bg-muted/5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <UserCircle className="size-4 text-muted-foreground" />
                  Who pays the commission?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
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
                  <Clock className="size-4 text-muted-foreground" />
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
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
                    Min
                  </div>
                </div>
                {errors.invoiceExpirationMinutes && (
                  <p className="text-[10px] font-medium text-destructive">
                    {errors.invoiceExpirationMinutes.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tolerance" className="flex items-center gap-2">
                  <Percent className="size-4 text-muted-foreground" />
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
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                    %
                  </div>
                </div>
                {errors.underpaymentTolerancePercentage && (
                  <p className="text-[10px] font-medium text-destructive">
                    {errors.underpaymentTolerancePercentage.message}
                  </p>
                )}
              </div>
            </div>

            {/* BIP21 QR Mode */}
            <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/5">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <QrCode className="size-4 text-muted-foreground" />
                  Premium QR Mode (BIP21)
                </Label>
                <p className="text-[10px] text-muted-foreground">
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
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Enabled Assets (Checkout)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2 p-2 border border-border/40 rounded-lg hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => toggleCurrency(c)}
                  >
                    <Checkbox
                      id={`cur-${c}`}
                      checked={enabledCurrencies.includes(c)}
                      onCheckedChange={() => toggleCurrency(c)}
                    />
                    <Label
                      htmlFor={`cur-${c}`}
                      className="text-xs cursor-pointer"
                    >
                      {c.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.enabledCurrencies && (
                <p className="text-[10px] font-medium text-destructive">
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
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Update Engine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
