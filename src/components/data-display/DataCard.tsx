import React, { useState } from "react";
import { cn } from "../../lib/utils.js";

interface Field {
  label: string;
  key: string;
  render?: (value: any) => React.ReactNode;
}

interface DataCardProps {
  title: string;
  subtitle?: string;
  fields: Field[];
  data: any;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: "primary" | "success" | "warning" | "error";
}

export function DataCard({
  title,
  subtitle,
  fields,
  data,
  defaultExpanded = false,
  actions,
  className,
  badge,
  badgeColor = "primary",
}: DataCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const badgeClasses = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
  };

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div
        className="flex items-start justify-between cursor-pointer -m-6 p-6 hover:bg-gray-50 rounded-t-xl transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className={cn("badge", badgeClasses[badgeColor])}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>

        <button className="text-gray-400 hover:text-gray-600 transition-colors ml-4">
          <svg
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="mt-6 space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </dt>
                <dd className="text-sm text-gray-900">
                  {field.render
                    ? field.render(data[field.key])
                    : data[field.key] || (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                </dd>
              </div>
            ))}
          </dl>

          {actions && (
            <div className="pt-4 border-t border-gray-200 flex gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
