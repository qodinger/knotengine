"use client";

import { useBalances } from "./hooks/use-balances";
import { BalancesHeader } from "./components/balances-header";
import { StatsGrid } from "./components/stats-grid";
import { WalletSection } from "./components/wallet-section";
import { AnalyticsCharts } from "./components/analytics-charts";

export default function BalancesPage() {
  const {
    wallets,
    merchant,
    stats,
    invoices,
    loading,
    copiedField,
    isAddWalletOpen,
    setIsAddWalletOpen,
    newWalletAddress,
    newWalletCoin,
    setNewWalletCoin,
    newWalletNetwork,
    setNewWalletNetwork,
    isAddingWallet,
    walletToRemove,
    setWalletToRemove,
    isRemovingWallet,
    copyAddress,
    handleAddressChange,
    handleAddWallet,
    handleRemoveWallet,
  } = useBalances();

  return (
    <div className="flex flex-col gap-6">
      <BalancesHeader />

      <StatsGrid stats={stats} invoices={invoices} loading={loading} />

      <WalletSection
        merchant={merchant}
        wallets={wallets}
        copiedField={copiedField}
        isAddWalletOpen={isAddWalletOpen}
        setIsAddWalletOpen={setIsAddWalletOpen}
        newWalletAddress={newWalletAddress}
        newWalletCoin={newWalletCoin}
        setNewWalletCoin={setNewWalletCoin}
        newWalletNetwork={newWalletNetwork}
        setNewWalletNetwork={setNewWalletNetwork}
        isAddingWallet={isAddingWallet}
        handleAddressChange={handleAddressChange}
        handleAddWallet={handleAddWallet}
        walletToRemove={walletToRemove}
        setWalletToRemove={setWalletToRemove}
        isRemovingWallet={isRemovingWallet}
        handleRemoveWallet={handleRemoveWallet}
        copyAddress={copyAddress}
      />

      <AnalyticsCharts invoices={invoices} />
    </div>
  );
}
