"use client";

import { ReactNode } from "react";

interface Props {
  data: Record<string, {
    ask: string;
    bid: string;
    last: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    open24h: string;
  }>;
  action?: ReactNode;
}

const PAIR_ICONS: Record<string, string> = {
  LINK: "🔗", SOL: "◎", ETH: "⟠", DOGE: "🐕", BTC: "₿",
};

function extractPairName(pair: string): string {
  const usdIdx = pair.indexOf("USD");
  if (usdIdx > 0) {
    let base = pair.substring(0, usdIdx);
    if (base === "XDOGE" || base === "XDG") return "DOGE";
    if (base === "XXBT") return "BTC";
    if (base === "XETH") return "ETH";
    return base;
  }
  return pair;
}

export function PriceCards({ data, action }: Props) {
  const entries = Object.entries(data);

  return (
    <div className="bg-kraken-card rounded-xl p-5 border border-kraken-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-kraken-muted uppercase tracking-wider">
          💹 Market Prices
        </h3>
        {action}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {entries.map(([pair, info]) => {
          const name = extractPairName(pair);
          const last = parseFloat(info.last);
          const open = parseFloat(info.open24h);
          const change = ((last - open) / open) * 100;
          const isUp = change >= 0;
          const icon = PAIR_ICONS[name] || "🪙";

          return (
            <div
              key={pair}
              className="bg-kraken-surface rounded-lg p-3 border border-kraken-border"
            >
              <div className="flex items-center gap-1 mb-1">
                <span>{icon}</span>
                <span className="font-medium text-white text-sm">{name}/USD</span>
              </div>
              <div className="text-lg font-bold text-white">
                ${last.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: last < 1 ? 6 : 2 })}
              </div>
              <div className={`text-xs font-medium ${isUp ? "text-kraken-green" : "text-kraken-red"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
              </div>
              {/* 24h range bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-kraken-muted mb-0.5">
                  <span>${parseFloat(info.low24h).toLocaleString("en-US", { maximumFractionDigits: last < 1 ? 4 : 2 })}</span>
                  <span>${parseFloat(info.high24h).toLocaleString("en-US", { maximumFractionDigits: last < 1 ? 4 : 2 })}</span>
                </div>
                <div className="relative w-full h-1.5 bg-kraken-border rounded-full">
                  <div
                    className="absolute h-1.5 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #FF4D4D, #FFB020, #00C076)",
                      left: "0%",
                      right: "0%",
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-white rounded-full -top-[1px] shadow-md border border-kraken-border"
                    style={{
                      left: `${Math.min(Math.max(((last - parseFloat(info.low24h)) / (parseFloat(info.high24h) - parseFloat(info.low24h))) * 100, 0), 100)}%`,
                      transform: "translateX(-50%)",
                    }}
                    title={`Current: $${last}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
