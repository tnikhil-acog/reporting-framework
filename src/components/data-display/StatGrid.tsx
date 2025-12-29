import React from "react";
import { cn } from "../../lib/utils.js";

interface Stat {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  color?: "primary" | "success" | "warning" | "error";
}

interface StatGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ stats, columns = 3, className }: StatGridProps) {
  const colorClasses = {
    primary: "border-primary-200 bg-primary-50",
    success: "border-green-200 bg-green-50",
    warning: "border-orange-200 bg-orange-50",
    error: "border-red-200 bg-red-50",
  };

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={cn(
            "card border-l-4",
            stat.color ? colorClasses[stat.color] : "border-gray-200"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
              {stat.subtext && (
                <p className="mt-1 text-sm text-gray-500">{stat.subtext}</p>
              )}
            </div>
            {stat.icon && (
              <span className="text-3xl opacity-50">{stat.icon}</span>
            )}
          </div>

          {stat.trend && (
            <div className="mt-4 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  stat.trend.direction === "up"
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {stat.trend.direction === "up" ? "↑" : "↓"}{" "}
                {Math.abs(stat.trend.value)}%
              </span>
              <span className="text-sm text-gray-500">vs previous</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
