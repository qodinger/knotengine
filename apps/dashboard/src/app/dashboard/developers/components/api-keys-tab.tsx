"use client";

import {
  Copy,
  Check,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  Terminal,
  ExternalLink,
  Key,
} from "lucide-react";
import { cn, dedent } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useApiKeys } from "../hooks/use-api-keys";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export function ApiKeysTab() {
  const {
    session,
    copied,
    rotating,
    isRotateDialogOpen,
    setIsRotateDialogOpen,
    newKey,
    setNewKey,
    selectedIntegrationLanguage,
    setSelectedIntegrationLanguage,
    copyToClipboard,
    handleRotateKey,
  } = useApiKeys();

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Standard keys</CardTitle>
          <CardDescription className="text-xs">
            These keys authenticate API requests. Secret keys are only visible
            once upon creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="grid gap-2 mb-6">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Merchant ID
            </Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={(session?.user as any)?.publicMerchantId || ""}
                className="bg-muted/30 font-mono text-xs h-9"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() =>
                  copyToClipboard(
                    (session?.user as any)?.publicMerchantId || "",
                    "merchantId",
                  )
                }
              >
                {copied === "merchantId" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Your unique identifier for API requests and support.
            </p>
          </div>

          <Table className="border rounded-md overflow-hidden">
            <TableHeader>
              <TableRow className="bg-muted/5 hover:bg-muted/5">
                <TableHead className="w-[160px] pl-6 text-xs">Name</TableHead>
                <TableHead className="text-xs">Token</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="group">
                <TableCell className="font-medium pl-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Key className="size-3.5 text-muted-foreground" />
                    Secret key
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground tracking-wider text-sm">
                  <div className="flex items-center gap-2">
                    <span>
                      {session?.user?.apiKey
                        ? `knot_sk_...${session.user.apiKey.slice(-4)}`
                        : "knot_sk_********************"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-bold tracking-wide h-4 px-1"
                    >
                      Live
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs">
                        Actions
                      </DropdownMenuLabel>
                      {session?.user?.apiKey && (
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() =>
                            copyToClipboard(session.user.apiKey as string, "sk")
                          }
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy key
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => setIsRotateDialogOpen(true)}
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Roll key...
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs text-destructive focus:text-destructive">
                        <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                        Revoke key
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6 mt-6 items-start w-full">
        <Card className="border shadow-sm bg-[#0c0c0c] text-slate-50 relative overflow-hidden w-full group">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="flex flex-col gap-10">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-50">
                    Integration Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    The fastest way to test and integrate with TypePay.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-slate-50">
                      Create an invoice
                    </h4>
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
                    Generate a new payment invoice instantly using our REST API
                    or the official Node.js SDK.
                  </p>
                  <div className="flex pt-2 text-xs">
                    <a
                      href="#"
                      className="text-slate-300 hover:text-white inline-flex items-center gap-1.5 transition-colors font-medium"
                    >
                      API Reference <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setSelectedIntegrationLanguage("nodejs")}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
                        selectedIntegrationLanguage === "nodejs"
                          ? "bg-[#0A0A0A] text-slate-100 shadow-sm border border-white/5"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      Node.js SDK
                    </button>
                    <button
                      onClick={() => setSelectedIntegrationLanguage("curl")}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all",
                        selectedIntegrationLanguage === "curl"
                          ? "bg-[#0A0A0A] text-slate-100 shadow-sm border border-white/5"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      cURL
                    </button>
                  </div>
                </div>

                {selectedIntegrationLanguage === "curl" ? (
                  <CodeBlock
                    language="bash"
                    className="w-full"
                    code={dedent`
                      curl -X POST ${API_BASE_URL}/v1/invoices \\
                        -H "x-api-key: YOUR_KEY" \\
                        -H "Content-Type: application/json" \\
                        -d '{ "amount_usd": 100, "currency": "BTC" }'
                    `}
                  />
                ) : (
                  <div className="space-y-4">
                    <CodeBlock
                      language="typescript"
                      className="w-full"
                      code={dedent`
                        import { KnotEngine } from '@qodinger/knot-sdk';

                        const knot = new KnotEngine({ apiKey: 'YOUR_KEY' });

                        const invoice = await knot.createInvoice({
                          amount_usd: 100,
                          currency: 'BTC'
                        });
                      `}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll API Key</DialogTitle>
            <DialogDescription>
              Are you sure? The current key will be invalidated immediately, and
              any applications using it will stop working.
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

      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>
              Copy your new API key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Input
              readOnly
              value={newKey || ""}
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={() => newKey && copyToClipboard(newKey, "newkey")}
            >
              {copied === "newkey" ? (
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
            <AlertTitle className="text-sm">Save this key</AlertTitle>
            <AlertDescription className="text-xs">
              Save this key in a secure location like a password manager or
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
