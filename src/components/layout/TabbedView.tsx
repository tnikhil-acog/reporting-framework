import React, { useState } from "react";
import { cn } from "../../lib/utils.js";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: string;
}

interface TabbedViewProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function TabbedView({ tabs, defaultTab, className }: TabbedViewProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn("card p-0", className)}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 font-medium text-sm transition-all duration-200 whitespace-nowrap",
              "border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">{activeContent}</div>
    </div>
  );
}
