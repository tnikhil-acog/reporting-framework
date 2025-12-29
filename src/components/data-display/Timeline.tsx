import React from "react";
import { cn, formatDate } from "../../lib/utils.js";

interface TimelineEvent {
  date: string | Date;
  title: string;
  description?: string;
  type?: "default" | "success" | "warning" | "error";
  icon?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const typeColors = {
    default: "bg-primary-500",
    success: "bg-green-500",
    warning: "bg-orange-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("card", className)}>
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
          style={{ marginLeft: "0.5rem" }}
        />

        <div className="space-y-8">
          {events.map((event, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Icon/Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                    typeColors[event.type || "default"]
                  )}
                >
                  {event.icon || i + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.date)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
