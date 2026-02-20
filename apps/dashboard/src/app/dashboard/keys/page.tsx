"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Copy,
  Check,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export default function ApiKeysPage() {
  const { data: session, update: updateSession } = useSession();
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);

  // State for the newly generated key to show in the "Reveal" dialog
  const [newKey, setNewKey] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      // Endpoint to rotate/generate key
      const res = await api.post("/v1/merchants/me/keys");
      const data = res.data;

      // Update session with new key (optional if we want to use it elsewhere immediately)
      await updateSession({ apiKey: data.apiKey });

      // Show the new key to the user
      setNewKey(data.apiKey);
      setIsRotateDialogOpen(false); // Close confirmation dialog
    } catch (err) {
      console.error("Failed to rotate key:", err);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="pb-4 border-b border-border/40">
        <h1 className="text-2xl font-bold tracking-tight">API keys</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your API keys to authenticate requests to the KnotEngine API.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Standard Keys Section */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Standard keys</CardTitle>
            <CardDescription>
              These keys allow you to authenticate API requests. Secret keys are
              only visible once upon creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5 hover:bg-muted/5">
                  <TableHead className="w-[200px] pl-6">Name</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="group">
                  <TableCell className="font-medium pl-6">Secret key</TableCell>
                  <TableCell className="font-mono text-muted-foreground tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>
                        {session?.user?.apiKey
                          ? `knot_sk_...${session.user.apiKey.slice(-4)}`
                          : "knot_sk_********************"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold tracking-wide"
                      >
                        Live
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {session?.user?.apiKey ? "Active" : "Never"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    —
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {session?.user?.apiKey && (
                          <DropdownMenuItem
                            onClick={() =>
                              copyToClipboard(session.user.apiKey as string)
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy key
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setIsRotateDialogOpen(true)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Roll key...
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Revoke key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <TableRow className="group border-t">
                  <TableCell className="font-medium pl-6">
                    Webhook secret
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>knot_wh_********************</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    —
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    —
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Developer Quickstart / Curl */}
        <Card className="border shadow-sm bg-slate-950 text-slate-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg text-slate-50">
                Developer Quickstart
              </CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Use this curl command to test your integration immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-white/10 group relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() =>
                  copyToClipboard(`curl -X POST ${API_BASE_URL}/v1/invoices \\
  -H "x-api-key: YOUR_KEY" \\
  -d '{ "amount_usd": 100, "currency": "BTC" }'`)
                }
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <div className="text-slate-300 leading-relaxed">
                <span className="text-pink-400">curl</span> -X POST{" "}
                {API_BASE_URL}/v1/invoices \<br />
                &nbsp;&nbsp;-H{" "}
                <span className="text-emerald-400">
                  &quot;x-api-key: YOUR_KEY&quot;
                </span>{" "}
                \<br />
                &nbsp;&nbsp;-d{" "}
                <span className="text-emerald-400">
                  &apos;{'{ "amount_usd": 100, "currency": "BTC" }'}&apos;
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm text-slate-400">
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Documentation &rarr;
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                API Reference &rarr;
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotate Key Confirmation Dialog */}
      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to roll this key? The current key will be
              invalidated immediately, and any applications using it will stop
              working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRotateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRotateKey}
              disabled={rotating}
            >
              {rotating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Roll key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Reveal Dialog */}
      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>
              Please copy your new API key now. You will not be able to see it
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={newKey || ""}
                className="font-mono text-sm"
              />
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => newKey && copyToClipboard(newKey)}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Alert
            variant="default"
            className="bg-amber-500/10 text-amber-600 border-amber-500/20 mb-4"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Save this key</AlertTitle>
            <AlertDescription>
              Store this key in a secure location like a password manager or
              environment variable.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button type="button" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
