"use client";

import { EventsTab } from "../developers/components/events-tab";

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          A real-time record of all system events, webhook attempts, and store
          alerts.
        </p>
      </div>

      <EventsTab />
    </div>
  );
}
