"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { io, Socket } from "socket.io-client";
import { fetcher, swrKeys } from "@/lib/swr";

export type TabNotification = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
};

interface NotificationsResponse {
  data: TabNotification[];
}

export function useEvents() {
  const { data: session } = useSession();
  const merchantId = session?.user?.merchantId;

  const [selectedEvent, setSelectedEvent] = useState<TabNotification | null>(
    null,
  );

  const {
    data: notificationsData,
    isLoading: eventsLoading,
    mutate: mutateNotifications,
  } = useSWR<NotificationsResponse>(
    merchantId ? swrKeys.notifications() : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const notifications = notificationsData?.data ?? [];

  // Real-time WebSocket updates
  useEffect(() => {
    if (!merchantId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";
    const socket: Socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("join_merchant", merchantId);
    });

    socket.on("notification", (newNotification: TabNotification) => {
      // Optimistically prepend the new notification to the SWR cache
      mutateNotifications(
        (current) => {
          if (!current) return { data: [newNotification] };
          return { data: [newNotification, ...current.data] };
        },
        { revalidate: false },
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [merchantId, mutateNotifications]);

  const fetchNotifications = () => {
    mutateNotifications();
  };

  return {
    notifications,
    eventsLoading,
    selectedEvent,
    setSelectedEvent,
    fetchNotifications,
  };
}
