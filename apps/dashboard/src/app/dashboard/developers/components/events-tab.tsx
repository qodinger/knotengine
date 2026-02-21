"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  Bell,
  CheckCircle2,
  Clock as ClockIcon,
  XCircle,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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

type TabNotification = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
};

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
        "size-7 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105",
        config.class,
      )}
    >
      <Icon className="size-3.5" />
    </div>
  );
}

export function EventsTab() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<TabNotification[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TabNotification | null>(
    null,
  );

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.merchantId) return;
    setEventsLoading(true);
    try {
      const res = await api.get("/v1/merchants/me/notifications");
      setNotifications(res.data.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setEventsLoading(false);
    }
  }, [session?.user?.merchantId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!session?.user?.merchantId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";
    const socket: Socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("join_merchant", session.user.merchantId);
    });

    socket.on("notification", (newNotification: TabNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?.merchantId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Real-time activity log for your store
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={eventsLoading}
          className="h-8 text-[10px] font-bold uppercase tracking-widest bg-card/40 border-border/50 backdrop-blur-sm"
        >
          <RefreshCw
            className={cn(
              "size-3 mr-2 text-primary",
              eventsLoading && "animate-spin",
            )}
          />
          Refresh
        </Button>
      </div>

      <Card className="bg-card/30 border-border/40 backdrop-blur-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[200px] text-[10px] font-bold pl-6 uppercase tracking-wider">
                Event Type
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="w-[160px] text-right pr-6 text-[10px] font-bold uppercase tracking-wider">
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
                      <div className="size-7 bg-muted animate-pulse rounded-lg" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-full max-w-md bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="h-4 w-20 ml-auto bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <Bell className="size-6 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        No activity yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Incoming store events will appear here in real-time.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow
                  key={n._id}
                  className="group border-border/10 transition-all hover:bg-primary/2 cursor-pointer"
                  onClick={() => setSelectedEvent(n)}
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <EventIcon type={n.type} />
                      <span className="text-xs font-bold text-foreground">
                        {n.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-xs text-muted-foreground/80 font-medium line-clamp-1 group-hover:text-foreground transition-colors">
                      {n.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 px-2 py-1 rounded-md">
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
      </Card>

      <Sheet
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <SheetContent className="w-[450px] sm:w-[540px] px-0">
          <SheetHeader className="px-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-2">
              {selectedEvent && <EventIcon type={selectedEvent.type} />}
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest bg-muted/30 px-2"
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
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Message
                </h4>
                <p className="text-sm font-medium leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/40">
                  {selectedEvent?.description}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Technical Metadata
                </h4>
                <div className="rounded-xl border border-border/40 bg-zinc-950 p-6 overflow-hidden">
                  <pre className="text-[11px] font-mono leading-relaxed text-zinc-300 whitespace-pre-wrap">
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

              <div className="pt-4 border-t border-border/40">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                      Severity
                    </p>
                    <p className="text-xs font-bold capitalize">
                      {selectedEvent?.type || "info"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                      Trace ID
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
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
