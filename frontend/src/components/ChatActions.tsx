"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { usePinContext } from "@/context/PinContext";
import { PortfolioCard } from "./PortfolioCard";
import { DonutChart } from "./DonutChart";
import { PriceCards } from "./PriceCards";
import { OrderTable } from "./OrderTable";
import { TradeHistory } from "./TradeHistory";
import { useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function callTool(name: string) {
  const res = await fetch(`${BACKEND_URL}/api/tool/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

function PinButton({ type, data }: { type: string; data: any }) {
  const { pinWidget, unpinWidget, isPinned, getPinnedId } = usePinContext();
  const pinned = isPinned(type);

  return pinned ? (
    <button
      onClick={() => unpinWidget(getPinnedId(type)!)}
      className="text-xs bg-kraken-red/20 hover:bg-kraken-red/40 text-kraken-red px-2 py-1 rounded transition-colors"
      title="Unpin from dashboard"
    >
      ✕ Unpin
    </button>
  ) : (
    <button
      onClick={() => pinWidget(type, data)}
      className="text-xs bg-kraken-purple/20 hover:bg-kraken-purple/40 text-kraken-purple px-2 py-1 rounded transition-colors"
      title="Pin to dashboard"
    >
      📌 Pin
    </button>
  );
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
      {text}
    </div>
  );
}

export function ChatActions() {
  useCopilotAction({
    name: "showPortfolio",
    description:
      "Show the user's full portfolio summary with asset allocation. Call this when user asks about portfolio, balance, holdings, total value, how assets are doing, or any general account question.",
    parameters: [
      {
        name: "reason",
        type: "string",
        description: "Brief reason for showing portfolio",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status === "executing") return <LoadingSpinner text="Loading portfolio..." />;
      if (status !== "complete" || !result) return null;
      const data = typeof result === "string" ? JSON.parse(result) : result;
      if (!data?.totalUsd && !data?.assets) return null;
      return (
        <div className="space-y-3 my-2">
          <PortfolioCard data={data} action={<PinButton type="portfolio" data={data} />} />
          <DonutChart data={data} action={<PinButton type="donut" data={data} />} />
        </div>
      );
    },
    handler: async () => {
      const data = await callTool("getPortfolioSummary");
      return JSON.stringify(data);
    },
  });

  useCopilotAction({
    name: "showPrices",
    description:
      "Show current market prices for crypto assets. Call this when user asks about prices, market, how much something costs, ticker data, or price changes.",
    parameters: [
      {
        name: "reason",
        type: "string",
        description: "Brief reason for showing prices",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status === "executing") return <LoadingSpinner text="Fetching prices..." />;
      if (status !== "complete" || !result) return null;
      const data = typeof result === "string" ? JSON.parse(result) : result;
      if (!data || typeof data !== "object") return null;
      return (
        <div className="my-2">
          <PriceCards data={data} action={<PinButton type="prices" data={data} />} />
        </div>
      );
    },
    handler: async () => {
      const data = await callTool("getTicker");
      return JSON.stringify(data);
    },
  });

  useCopilotAction({
    name: "showOrders",
    description:
      "Show open/pending orders on Kraken. Call this when user asks about open orders, pending orders, limit orders, or sell orders.",
    parameters: [
      {
        name: "reason",
        type: "string",
        description: "Brief reason for showing orders",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status === "executing") return <LoadingSpinner text="Checking orders..." />;
      if (status !== "complete" || !result) return null;
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="my-2">
          <OrderTable data={Array.isArray(data) ? data : []} action={<PinButton type="orders" data={data} />} />
        </div>
      );
    },
    handler: async () => {
      const data = await callTool("getOpenOrders");
      return JSON.stringify(data);
    },
  });

  useCopilotAction({
    name: "showTrades",
    description:
      "Show recent trade history/fills from Kraken. Call this when user asks about trades, trade history, recent fills, or past transactions.",
    parameters: [
      {
        name: "reason",
        type: "string",
        description: "Brief reason for showing trades",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status === "executing") return <LoadingSpinner text="Loading trade history..." />;
      if (status !== "complete" || !result) return null;
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="my-2">
          <TradeHistory data={Array.isArray(data) ? data : []} action={<PinButton type="trades" data={data} />} />
        </div>
      );
    },
    handler: async () => {
      const data = await callTool("getTradeHistory");
      return JSON.stringify(data);
    },
  });

  return null;
}
