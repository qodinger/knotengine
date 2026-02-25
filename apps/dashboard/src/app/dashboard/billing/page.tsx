"use client";

import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBilling } from "./hooks/use-billing";
import { BillingHeader } from "./components/billing-header";
import { CreditBalanceCard } from "./components/credit-balance-card";
import { TopUpDialog } from "./components/top-up-dialog";
import { HowItWorks } from "./components/how-it-works";
import { InsufficientBalanceWarning } from "./components/insufficient-balance-warning";
import { PromoCodeCard } from "./components/promo-code-card";
import { GracePeriodStatus } from "./components/grace-period-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BillingPage() {
  const {
    stats,
    loading,
    copiedField,
    txHash,
    setTxHash,
    selectedCoin,
    setSelectedCoin,
    selectedCurrency,
    setSelectedCurrency,
    isClaiming,
    claimStatus,
    isTopUpOpen,
    setIsTopUpOpen,
    topUpStep,
    setTopUpStep,
    usdAmount,
    setUsdAmount,
    cryptoAmount,
    isGenerating,
    generateError,
    copyAddress,
    handleOpenTopUp,
    handleGeneratePayment,
    submitClaim,
    getWalletAddress,
    handleUpdatePlan,
    handleChargePlan,
    insufficientBalance,
    setInsufficientBalance,
    handleWarningClose,
    fetchData,
  } = useBilling();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<
    "starter" | "professional" | "enterprise" | null
  >(null);
  const [isActivating, setIsActivating] = useState(false);

  const onPlanUpdateClick = (
    plan: "starter" | "professional" | "enterprise",
  ) => {
    setPendingPlan(plan);
    setIsActivating(false);
    setConfirmDialogOpen(true);
  };

  const onActivateClick = () => {
    setPendingPlan(stats?.currentPlan || null);
    setIsActivating(true);
    setConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (isActivating) {
      await handleChargePlan();
    } else if (pendingPlan) {
      await handleUpdatePlan(pendingPlan);
    }
    setConfirmDialogOpen(false);
  };

  const isTopUpDisabled =
    !loading &&
    (!stats?.platformFeeWallets ||
      !Object.values(stats.platformFeeWallets).some(Boolean));

  return (
    <div className="flex flex-col gap-6">
      <BillingHeader
        onTopUpClick={handleOpenTopUp}
        isTopUpDisabled={isTopUpDisabled}
        currentPlan={stats?.currentPlan}
      />

      <CreditBalanceCard stats={stats} loading={loading} />

      {stats?.isGracePeriod && (
        <GracePeriodStatus
          isActive={true}
          planName={stats.currentPlan}
          daysRemaining={
            stats.gracePeriodEnds
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(stats.gracePeriodEnds).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : undefined
          }
          onActivate={onActivateClick}
          isCharging={loading}
        />
      )}

      <PromoCodeCard onSuccess={fetchData} />

      {!loading && isTopUpDisabled && (
        <Card className="border-border/40 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Coins className="text-muted-foreground/20 mb-3 size-8" />
            <p className="text-muted-foreground/60 mb-1 text-sm font-medium">
              No top-up wallets configured
            </p>
            <p className="text-muted-foreground/40 max-w-xs text-xs">
              Platform fee wallets have not been set up yet. Contact the
              platform administrator.
            </p>
          </CardContent>
        </Card>
      )}

      <TopUpDialog
        isOpen={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        stats={stats}
        step={topUpStep}
        setStep={setTopUpStep}
        usdAmount={usdAmount}
        setUsdAmount={setUsdAmount}
        selectedCoin={selectedCoin}
        setSelectedCoin={setSelectedCoin}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        isGenerating={isGenerating}
        generateError={generateError}
        handleGeneratePayment={handleGeneratePayment}
        cryptoAmount={cryptoAmount}
        getWalletAddress={getWalletAddress}
        txHash={txHash}
        setTxHash={setTxHash}
        isClaiming={isClaiming}
        claimStatus={claimStatus}
        submitClaim={submitClaim}
        copyAddress={copyAddress}
        copiedField={copiedField}
      />

      <HowItWorks
        feeRate={stats?.currentFeeRate ?? 0.01}
        currentPlan={stats?.currentPlan}
        onPlanUpdate={onPlanUpdateClick}
      />

      {insufficientBalance && (
        <InsufficientBalanceWarning
          open={insufficientBalance.open}
          onOpenChange={(open) => {
            setInsufficientBalance(open ? insufficientBalance : null);
            if (!open) {
              handleWarningClose();
            }
          }}
          requiredAmount={insufficientBalance.requiredAmount}
          currentBalance={insufficientBalance.currentBalance}
          planName={insufficientBalance.planName}
          isProrated={insufficientBalance.isProrated}
          onTopUp={handleOpenTopUp}
        />
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActivating ? "Activate Plan" : "Change Subscription Plan"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActivating ? (
                <>
                  Are you sure you want to activate your{" "}
                  <span className="font-bold text-white">
                    {stats?.currentPlan}
                  </span>{" "}
                  plan now? This will charge the monthly fee from your credit
                  balance.
                </>
              ) : (
                <>
                  Are you sure you want to switch to the{" "}
                  <span className="font-bold text-white">{pendingPlan}</span>{" "}
                  plan? This change will take effect immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isActivating ? (
                "Confirm Activation"
              ) : (
                "Confirm Change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
