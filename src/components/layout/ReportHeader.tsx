import React from "react";
import { cn, formatDate } from "../../lib/utils.js";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  timestamp?: string | Date;
  stats?: Array<{ label: string; value: string | number }>;
  className?: string;
}

export function ReportHeader({
  title,
  subtitle,
  timestamp,
  stats,
  className,
}: ReportHeaderProps) {
  return (
    <div
      className={cn(
        "card bg-gradient-to-r from-primary-600 to-primary-700 text-white",
        className
      )}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-primary-100 text-lg">{subtitle}</p>}
        </div>

        {timestamp && (
          <div className="text-sm text-primary-100">
            Generated: {formatDate(timestamp)}
          </div>
        )}

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary-500">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
