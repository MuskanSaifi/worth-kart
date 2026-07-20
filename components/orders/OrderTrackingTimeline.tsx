"use client";

import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  title: string;
  message?: string | null;
  status?: string | null;
  source: string;
  createdAt: string;
};

export function OrderTrackingTimeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  if (!events.length) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        Tracking updates will appear here.
      </p>
    );
  }

  return (
    <ol className={cn("relative border-l border-gray-200 ml-2 space-y-4", className)}>
      {[...events].reverse().map((ev, i) => (
        <li key={ev.id} className="ml-4">
          <span
            className={cn(
              "absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white",
              i === 0 ? "bg-[#007185]" : "bg-gray-300"
            )}
          />
          <p className={cn("text-sm font-semibold", i === 0 ? "text-gray-900" : "text-gray-700")}>
            {ev.title}
          </p>
          {ev.message && <p className="text-xs text-muted mt-0.5">{ev.message}</p>}
          <p className="text-[11px] text-muted mt-1">
            {new Date(ev.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span className="mx-1">·</span>
            <span className="capitalize">{ev.source}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
