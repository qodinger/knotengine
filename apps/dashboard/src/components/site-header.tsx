"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  type: "success" | "warning" | "error" | "info";
  link?: string;
};

export function SiteHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.merchantId) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/v1/merchants/me/notifications");
        setNotifications(
          res.data.data.map((n: Notification & { _id: string }) => ({
            id: n._id,
            title: n.title,
            description: n.description,
            createdAt: n.createdAt,
            isRead: n.isRead,
            type: n.type,
            link: n.link,
          })),
        );
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
  }, [user?.merchantId]);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user?.merchantId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";
    const socket: Socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("🔌 Connected to notification socket");
      socket.emit("join_merchant", user.merchantId);
    });

    socket.on(
      "notification",
      (newNotification: Notification & { id: string }) => {
        console.log("🔔 New notification received:", newNotification);
        setNotifications((prev) => [
          {
            id: newNotification.id,
            title: newNotification.title,
            description: newNotification.description,
            createdAt: newNotification.createdAt,
            isRead: newNotification.isRead,
            type: newNotification.type,
            link: newNotification.link,
          },
          ...prev,
        ]);
      },
    );

    socket.on(
      "notification_updated",
      (updatedNotification: Notification & { id: string }) => {
        console.log("🔄 Notification updated:", updatedNotification);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === updatedNotification.id
              ? {
                  ...n,
                  title: updatedNotification.title,
                  description: updatedNotification.description,
                  type: updatedNotification.type,
                  isRead: updatedNotification.isRead,
                }
              : n,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [user?.merchantId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markAllAsRead = async () => {
    try {
      await api.patch("/v1/merchants/me/notifications/mark-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/v1/merchants/me/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) w-full items-center border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex w-full items-center gap-2 px-8 h-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-9 w-9 hover:bg-muted/60" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden lg:flex relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Quick search..."
              className="pl-8 h-9 bg-muted/40 border-none transition-all focus:bg-background hover:bg-muted/60"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 hover:bg-muted/60 focus-visible:ring-0"
              >
                <Bell className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary border-2 border-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[380px] p-0 overflow-hidden bg-background/80 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <DropdownMenuLabel className="p-0 font-bold text-sm tracking-tight text-foreground/90">
                    Notifications
                  </DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[9px] font-bold bg-primary/10 text-primary border-none"
                    >
                      {unreadCount} NEW
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                    className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <ScrollArea className="h-[420px]">
                <div className="flex flex-col border-t border-border/20">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                      <div className="size-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                        <Bell className="size-6 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold tracking-tight">
                          Clear for now
                        </p>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[180px]">
                          We&apos;ll ping you here when your merchant has news.
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={cn(
                          "flex items-start gap-4 p-5 cursor-pointer focus:bg-muted/30 border-b border-border/10 last:border-0 transition-all group",
                          !n.isRead &&
                            "bg-primary/5 border-l-2 border-l-primary focus:bg-primary/10",
                        )}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          if (n.link) router.push(n.link);
                        }}
                      >
                        <NotificationIcon type={n.type} />

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className={cn(
                                "text-[12px] font-bold leading-none tracking-tight transition-colors",
                                !n.isRead
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                                "group-hover:text-foreground",
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap">
                              {formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] leading-normal text-muted-foreground/70 font-medium line-clamp-2 pr-2 group-hover:text-muted-foreground transition-colors">
                            {n.description}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 bg-muted/10 border-t border-border/20 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  className="w-full group h-10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary border border-border/20 rounded-xl"
                  asChild
                >
                  <Link href="/dashboard/activity">
                    Full Activity Log
                    <ExternalLink className="ml-2 size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">
                    {user?.name || "Merchant Owner"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email provided"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="p-3 cursor-pointer">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center w-full"
                >
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 cursor-pointer">
                <Link
                  href="/dashboard/balances"
                  className="flex items-center w-full"
                >
                  Balances
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="p-3 text-destructive font-bold cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const configs = {
    success: {
      icon: CheckCircle2,
      class: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    warning: {
      icon: Clock,
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

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "size-9 shrink-0 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110",
        config.class,
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}
