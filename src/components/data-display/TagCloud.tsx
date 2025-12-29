import React from "react";
import { cn } from "../../lib/utils.js";

interface Tag {
  text: string;
  count: number;
  color?: string;
}

interface TagCloudProps {
  tags: Tag[];
  maxTags?: number;
  colorScale?: string[];
  onTagClick?: (tag: Tag) => void;
  className?: string;
}

const DEFAULT_COLORS = [
  "#e3f2fd",
  "#bbdefb",
  "#90caf9",
  "#64b5f6",
  "#42a5f5",
  "#2196f3",
  "#1e88e5",
  "#1976d2",
];

export function TagCloud({
  tags,
  maxTags = 50,
  colorScale = DEFAULT_COLORS,
  onTagClick,
  className,
}: TagCloudProps) {
  const maxCount = Math.max(...tags.map((t) => t.count));
  const sortedTags = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTags);

  const getColor = (count: number, customColor?: string) => {
    if (customColor) return customColor;
    const index = Math.floor((count / maxCount) * (colorScale.length - 1));
    return colorScale[index];
  };

  const getFontSize = (count: number) => {
    const minSize = 12;
    const maxSize = 36;
    return minSize + (count / maxCount) * (maxSize - minSize);
  };

  return (
    <div className={cn("card", className)}>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag, i) => (
          <span
            key={i}
            onClick={() => onTagClick?.(tag)}
            className={cn(
              "inline-block px-3 py-1.5 rounded-full font-medium transition-all duration-200",
              onTagClick && "cursor-pointer hover:scale-110 hover:shadow-md"
            )}
            style={{
              fontSize: `${getFontSize(tag.count)}px`,
              backgroundColor: getColor(tag.count, tag.color),
              color: tag.count / maxCount > 0.6 ? "white" : "#1f2937",
            }}
          >
            {tag.text} <span className="opacity-75">({tag.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
