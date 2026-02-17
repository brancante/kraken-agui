"use client";

import { ReactNode } from "react";

interface Props {
  data: Array<{
    id: string;
    pair: string;
    type: string;
    orderType: string;
    price: string;
    cost: string;
    fee: string;
    volume: string;
    time: string;
  }>;
  action?: ReactNode;
}

export function TradeHistory({ data, action }: Props) {
  return (
    <div className="bg-kraken-card rounded-xl p-5 border border-kraken-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-kraken-muted uppercase tracking-wider">
          📜 Recent Trades
        </h3>
        {action}
      </div>
      {data.length === 0 ? (
        <p className="text-kraken-muted text-sm py-4 text-center">No recent trades</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.slice(0, 10).map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between text-sm py-2 border-b border-kraken-border/50"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  trade.type === "buy"
                    ? "bg-kraken-green/20 text-kraken-green"
                    : "bg-kraken-red/20 text-kraken-red"
                }`}>
                  {trade.type.toUpperCase()}
                </span>
                <span className="text-white font-medium">{trade.pair}</span>
              </div>
              <div className="text-right">
                <div className="text-white">{trade.volume} @ ${trade.price}</div>
                <div className="text-xs text-kraken-muted">
                  ${trade.cost} · {new Date(trade.time).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
