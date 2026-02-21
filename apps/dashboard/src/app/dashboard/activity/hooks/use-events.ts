"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

export type TabNotification = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
};

export function useEvents() {
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

  return {
    notifications,
    eventsLoading,
    selectedEvent,
    setSelectedEvent,
    fetchNotifications,
  };
}
