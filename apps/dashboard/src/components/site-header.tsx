"use client";

import { useState, useMemo, useEffect } from "react";

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
              className="w-[380px] p-0 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <DropdownMenuLabel className="p-0 font-bold text-sm">
                  Notifications
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                    className="text-[10px] uppercase tracking-wider font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <ScrollArea className="h-[400px]">
                <div className="flex flex-col">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                        <Bell className="size-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">
                        No notifications yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        We&apos;ll notify you when something happens.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={cn(
                          "flex items-start gap-4 p-4 cursor-pointer focus:bg-muted/50 border-b border-border/40 last:border-0",
                          !n.isRead && "bg-primary/5 focus:bg-primary/10",
                        )}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          if (n.link) window.location.href = n.link;
                        }}
                      >
                        <NotificationIcon type={n.type} />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={cn(
                                "text-xs font-bold leading-none",
                                !n.isRead
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-muted-foreground/80 line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 bg-muted/20 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full group h-9 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary border-none shadow-none"
                  asChild
                >
                  <Link href="/dashboard/developers?tab=events">
                    View Activity Log
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
                    {user?.name || "Store Owner"}
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
        "size-8 shrink-0 rounded-xl border flex items-center justify-center",
        config.class,
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}
