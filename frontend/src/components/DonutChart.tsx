"use client";

import { ReactNode } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#7B61FF", "#00C076", "#FF4D4D", "#FFB020", "#00B4D8", "#FF6B9D", "#54E382", "#A78BFA"];

interface Props {
  data: {
    totalUsd: number;
    assets: Array<{ asset: string; usdValue: number }>;
  };
  action?: ReactNode;
}

export function DonutChart({ data, action }: Props) {
  const chartData = data.assets
    .filter((a) => a.usdValue > 0)
    .map((a) => ({
      name: a.asset,
      value: a.usdValue,
    }));

  return (
    <div className="bg-kraken-card rounded-xl p-5 border border-kraken-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-kraken-muted uppercase tracking-wider">
          📊 Allocation
        </h3>
        {action}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1A1F2E",
                border: "1px solid #2A2F3E",
                borderRadius: "8px",
                color: "#E1E4E8",
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                "Value",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-kraken-muted">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
