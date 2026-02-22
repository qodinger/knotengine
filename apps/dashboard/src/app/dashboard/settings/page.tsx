"use client";

import { useSettings } from "./hooks/use-settings";
import { SettingsHeader } from "./components/settings-header";
import { MerchantDetailsCard } from "./components/merchant-details-card";
import { TwoFactorCard } from "./components/two-factor-card";
import { PaymentEngineCard } from "./components/payment-engine-card";
import { TwoFASetupDialog } from "./components/two-fa-setup-dialog";
import { TwoFADisableDialog } from "./components/two-fa-disable-dialog";
import { DangerZoneCard } from "./components/danger-zone-card";
import { SuccessToast } from "./components/success-toast";

export default function SettingsPage() {
  const {
    saving,
    success,
    deleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteConfirmationName,
    setDeleteConfirmationName,
    formData,
    twoFactorEnabled,
    twoFASetupDialogOpen,
    setTwoFASetupDialogOpen,
    twoFADisableDialogOpen,
    setTwoFADisableDialogOpen,
    twoFASetupData,
    twoFACode,
    setTwoFACode,
    twoFALoading,
    twoFAError,
    setTwoFAError,
    backupCodes,
    showBackupCodes,
    handleSave,
    handleDeleteMerchant,
    handleSetup2FA,
    handleEnable2FA,
    handleDisable2FA,
  } = useSettings();

  return (
    <div className="w-full space-y-4">
      <SettingsHeader />

      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MerchantDetailsCard
            formData={formData}
            onSave={handleSave}
            saving={saving}
          />

          <TwoFactorCard
            twoFactorEnabled={twoFactorEnabled}
            onEnable={handleSetup2FA}
            onDisable={() => {
              setTwoFADisableDialogOpen(true);
              setTwoFACode("");
              setTwoFAError("");
            }}
            loading={twoFALoading}
          />

          <PaymentEngineCard
            formData={formData}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        <DangerZoneCard
          businessName={formData.businessName}
          isDeleteDialogOpen={deleteDialogOpen}
          setIsDeleteDialogOpen={setDeleteDialogOpen}
          deleteConfirmationName={deleteConfirmationName}
          setDeleteConfirmationName={setDeleteConfirmationName}
          onDelete={handleDeleteMerchant}
          isDeleting={deleting}
        />
      </div>

      <TwoFASetupDialog
        open={twoFASetupDialogOpen}
        onOpenChange={setTwoFASetupDialogOpen}
        setupData={twoFASetupData}
        twoFACode={twoFACode}
        setTwoFACode={setTwoFACode}
        error={twoFAError}
        loading={twoFALoading}
        onVerify={handleEnable2FA}
        showBackupCodes={showBackupCodes}
        backupCodes={backupCodes}
      />

      <TwoFADisableDialog
        open={twoFADisableDialogOpen}
        onOpenChange={setTwoFADisableDialogOpen}
        twoFACode={twoFACode}
        setTwoFACode={setTwoFACode}
        error={twoFAError}
        loading={twoFALoading}
        onDisable={handleDisable2FA}
      />

      <SuccessToast show={success} />
    </div>
  );
}
