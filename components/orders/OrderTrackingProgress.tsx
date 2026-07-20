"use client";

import { Check } from "lucide-react";
import {
  TRACKING_STEPS,
  getTrackingHeadline,
  getTrackingStepIndex,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

interface OrderTrackingProgressProps {
  status: string;
  estimatedDeliveryAt?: string | Date | null;
  className?: string;
  showHeadline?: boolean;
}

export function OrderTrackingProgress({
  status,
  estimatedDeliveryAt,
  className,
  showHeadline = true,
}: OrderTrackingProgressProps) {
  const isTerminal = status === "CANCELLED" || status === "RETURNED";
  const activeIndex = isTerminal ? -1 : getTrackingStepIndex(status);
  const headline = getTrackingHeadline(status, estimatedDeliveryAt);

  if (isTerminal) {
    return (
      <div className={className}>
        {showHeadline && (
          <p className="text-lg font-bold text-gray-900 mb-4">{headline}</p>
        )}
        <p className="text-sm text-muted">
          {status === "CANCELLED"
            ? "This order was cancelled."
            : "This order has been returned."}
        </p>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className={className}>
        {showHeadline && (
          <p className="text-lg font-bold text-amber-700 mb-4">{headline}</p>
        )}
        <p className="text-sm text-muted">
          Complete payment to confirm your order.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeadline && (
        <p className="text-lg font-bold text-gray-900 mb-5">{headline}</p>
      )}

      <div className="relative px-1">
        <div className="absolute top-3 left-3 right-3 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-3 left-3 h-1 bg-[#007185] rounded-full transition-all duration-500"
          style={{
            width: `calc(${(activeIndex / (TRACKING_STEPS.length - 1)) * 100}% - 12px)`,
          }}
        />

        <div className="relative flex justify-between">
          {TRACKING_STEPS.map((step, index) => {
            const completed = index < activeIndex;
            const current = index === activeIndex;
            const upcoming = index > activeIndex;

            return (
              <div key={step.key} className="flex flex-col items-center w-0 flex-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 transition-colors",
                    completed && "bg-[#007185] border-[#007185]",
                    current && "bg-[#007185] border-[#007185]",
                    upcoming && "bg-white border-gray-300"
                  )}
                >
                  {(completed || current) && (
                    <Check size={14} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <p
                  className={cn(
                    "text-[10px] sm:text-xs mt-2 text-center leading-tight max-w-[72px]",
                    (completed || current) ? "text-gray-900 font-medium" : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
