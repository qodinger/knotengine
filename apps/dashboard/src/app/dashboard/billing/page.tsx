"use client";

import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBilling } from "./hooks/use-billing";
import { BillingHeader } from "./components/billing-header";
import { CreditBalanceCard } from "./components/credit-balance-card";
import { TopUpDialog } from "./components/top-up-dialog";
import { HowItWorks } from "./components/how-it-works";

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
  } = useBilling();

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
        onPlanUpdate={handleUpdatePlan}
      />
    </div>
  );
}
