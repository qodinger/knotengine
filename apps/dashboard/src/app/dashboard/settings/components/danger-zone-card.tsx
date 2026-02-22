"use client";

import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DangerZoneCardProps {
  businessName: string;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  deleteConfirmationName: string;
  setDeleteConfirmationName: (name: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function DangerZoneCard({
  businessName,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  deleteConfirmationName,
  setDeleteConfirmationName,
  onDelete,
  isDeleting,
}: DangerZoneCardProps) {
  const merchantNameForDelete = businessName || "Untitled Merchant";

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5 shadow-none overflow-hidden mt-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Irreversible actions for this merchant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background/50">
            <div>
              <div className="font-bold text-sm">Delete Merchant</div>
              <div className="text-xs text-muted-foreground">
                Permanently delete this merchant and all its data.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-3 mr-2" />
              Delete Merchant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Delete Merchant
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action <strong>cannot</strong> be undone. This will
              permanently delete the <strong>{merchantNameForDelete}</strong>{" "}
              merchant, invoices, webhook logs, and all associated settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmName" className="text-sm font-medium">
              Please type <strong>{merchantNameForDelete}</strong> to confirm.
            </Label>
            <Input
              id="confirmName"
              value={deleteConfirmationName}
              onChange={(e) => setDeleteConfirmationName(e.target.value)}
              placeholder="Type merchant name here..."
              autoComplete="off"
              className="col-span-3"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteConfirmationName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={
                isDeleting || deleteConfirmationName !== merchantNameForDelete
              }
            >
              {isDeleting ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
