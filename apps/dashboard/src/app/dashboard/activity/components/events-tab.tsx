"use client";

import {
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock as ClockIcon,
  XCircle,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEvents } from "../hooks/use-events";

function EventIcon({ type }: { type: string }) {
  const configs: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; class: string }
  > = {
    success: {
      icon: CheckCircle2,
      class: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    warning: {
      icon: ClockIcon,
      class: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    error: {
      icon: XCircle,
      class: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    info: {
      icon: Info,
      class: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
        config.class,
      )}
    >
      <Icon className="size-3.5" />
    </div>
  );
}

export function EventsTab() {
  const {
    notifications,
    eventsLoading,
    selectedEvent,
    setSelectedEvent,
    fetchNotifications,
  } = useEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
              Live Stream
            </span>
          </div>
          <p className="text-muted-foreground hidden text-xs sm:block">
            Real-time activity log for your merchant
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={eventsLoading}
          className="bg-card/40 border-border/50 h-8 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm"
        >
          <RefreshCw
            className={cn(
              "text-primary mr-2 size-3",
              eventsLoading && "animate-spin",
            )}
          />
          Refresh
        </Button>
      </div>

      <Card className="bg-card/30 border-border/40 gap-0 overflow-hidden py-0 shadow-sm backdrop-blur-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/40 h-12 hover:bg-transparent">
                <TableHead className="w-[200px] pl-6 text-[10px] font-bold tracking-wider uppercase">
                  Event Type
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Description
                </TableHead>
                <TableHead className="w-[160px] pr-6 text-right text-[10px] font-bold tracking-wider uppercase">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsLoading && notifications.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border/10">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted size-7 animate-pulse rounded-lg" />
                        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted h-4 w-full max-w-md animate-pulse rounded" />
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="bg-muted ml-auto h-4 w-20 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/30 flex size-12 items-center justify-center rounded-full">
                        <Bell className="text-muted-foreground/20 size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-semibold">
                          No activity yet
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Incoming merchant events will appear here in
                          real-time.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((n) => (
                  <TableRow
                    key={n._id}
                    className="group border-border/10 hover:bg-primary/2 cursor-pointer transition-all"
                    onClick={() => setSelectedEvent(n)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <EventIcon type={n.type} />
                        <span className="text-foreground text-xs font-bold">
                          {n.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-muted-foreground/80 group-hover:text-foreground line-clamp-1 text-xs font-medium transition-colors">
                        {n.description}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <span className="text-muted-foreground bg-muted/30 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <SheetContent className="w-[450px] px-0 sm:w-[540px]">
          <SheetHeader className="border-b px-8 pb-6">
            <div className="mb-2 flex items-center gap-3">
              {selectedEvent && <EventIcon type={selectedEvent.type} />}
              <Badge
                variant="outline"
                className="bg-muted/30 px-2 text-[10px] font-bold tracking-widest uppercase"
              >
                Event Details
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {selectedEvent?.title}
            </SheetTitle>
            <SheetDescription className="text-sm">
              Event occurred{" "}
              {selectedEvent &&
                formatDistanceToNow(new Date(selectedEvent.createdAt), {
                  addSuffix: true,
                })}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] px-8 py-6">
            <div className="space-y-8">
              <div className="space-y-3">
                <h4 className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Message
                </h4>
                <p className="bg-muted/20 border-border/40 rounded-xl border p-4 text-sm leading-relaxed font-medium">
                  {selectedEvent?.description}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Technical Metadata
                </h4>
                <div className="border-border/40 overflow-hidden rounded-xl border bg-zinc-950 p-6">
                  <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-300">
                    {JSON.stringify(
                      {
                        event_id: selectedEvent?._id,
                        type: selectedEvent?.type,
                        timestamp: selectedEvent?.createdAt,
                        origin: "knotengine-core",
                        environment: process.env.NODE_ENV || "production",
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>

              <div className="border-border/40 border-t pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 text-[10px] font-bold uppercase">
                      Severity
                    </p>
                    <p className="text-xs font-bold capitalize">
                      {selectedEvent?.type || "info"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-muted-foreground/60 text-[10px] font-bold uppercase">
                      Trace ID
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {selectedEvent?._id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
