import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: any[];
  xKey: string;
  lines: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  height?: number;
}

export function LineChart({
  data,
  xKey,
  lines,
  xLabel,
  yLabel,
  title,
  height = 400,
}: LineChartProps) {
  return (
    <div className="card">
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            label={
              xLabel
                ? { value: xLabel, position: "insideBottom", offset: -10 }
                : undefined
            }
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: "insideLeft" }
                : undefined
            }
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {lines.map((line, i) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || `hsl(${i * 60}, 70%, 50%)`}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
