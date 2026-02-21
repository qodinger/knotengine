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
        "size-6 rounded-md flex items-center justify-center border shrink-0",
        config.class,
      )}
    >
      <Icon className="size-3" />
    </div>
  );
}

export function EventsTab() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<TabNotification[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          A real-time record of all system events, webhook attempts, and account
          alerts.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={eventsLoading}
          className="h-8 text-[10px] font-bold uppercase tracking-wider"
        >
          <RefreshCw
            className={cn("size-3 mr-1.5", eventsLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[180px] text-[10px] font-bold pl-6 uppercase tracking-wider">
                Event Type
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="w-[140px] text-right pr-6 text-[10px] font-bold uppercase tracking-wider">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsLoading && notifications.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/10">
                  <TableCell className="pl-6">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-full max-w-sm bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="h-4 w-20 ml-auto bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Bell className="size-6 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground font-medium">
                      No events logged yet.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow
                  key={n._id}
                  className="group border-border/10 transition-colors hover:bg-muted/5 cursor-default"
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2.5">
                      <EventIcon type={n.type} />
                      <span className="text-xs font-bold leading-none">
                        {n.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground/90 line-clamp-1">
                      {n.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-right pr-6 whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-[10.5px] font-medium text-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
