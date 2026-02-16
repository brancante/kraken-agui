"use client";

import { ReactNode } from "react";

interface Props {
  data: {
    totalUsd: number;
    assets: Array<{
      asset: string;
      quantity: number;
      price: number | null;
      usdValue: number;
    }>;
    updatedAt: string;
  };
  action?: ReactNode;
}

export function PortfolioCard({ data, action }: Props) {
  return (
    <div className="bg-kraken-card rounded-xl p-5 border border-kraken-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-kraken-muted uppercase tracking-wider">
          💰 Portfolio Value
        </h3>
        {action}
      </div>
      <div className="text-3xl font-bold text-white mb-4">
        ${data.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </div>
      <div className="space-y-2">
        {data.assets.map((a) => {
          const pct = data.totalUsd > 0 ? (a.usdValue / data.totalUsd) * 100 : 0;
          return (
            <div key={a.asset} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{a.asset}</span>
                <span className="text-kraken-muted">
                  {a.quantity.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white">
                  ${a.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <div className="w-16 bg-kraken-border rounded-full h-1.5">
                  <div
                    className="bg-kraken-purple h-1.5 rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-kraken-muted w-12 text-right">{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-kraken-muted">
        Updated: {new Date(data.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
