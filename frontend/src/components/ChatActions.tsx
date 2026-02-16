"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { usePinContext } from "@/context/PinContext";
import { PortfolioCard } from "./PortfolioCard";
import { DonutChart } from "./DonutChart";
import { PriceCards } from "./PriceCards";
import { OrderTable } from "./OrderTable";
import { TradeHistory } from "./TradeHistory";

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

export function ChatActions() {
  useCopilotAction({
    name: "showPortfolio",
    description:
      "Show the user's full portfolio summary with asset allocation. Use when user asks about portfolio, balance, holdings, total value, or how their assets are doing.",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading portfolio...
          </div>
        );
      }
      if (!result) return null;
      return (
        <div className="space-y-3 my-2">
          <PortfolioCard
            data={result}
            action={<PinButton type="portfolio" data={result} />}
          />
          <DonutChart
            data={result}
            action={<PinButton type="donut" data={result} />}
          />
        </div>
      );
    },
    handler: async () => {
      return await callTool("getPortfolioSummary");
    },
  });

  useCopilotAction({
    name: "showPrices",
    description:
      "Show current market prices for crypto assets. Use when user asks about prices, market, how much something costs, or ticker data.",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Fetching prices...
          </div>
        );
      }
      if (!result) return null;
      return (
        <div className="my-2">
          <PriceCards
            data={result}
            action={<PinButton type="prices" data={result} />}
          />
        </div>
      );
    },
    handler: async () => {
      return await callTool("getTicker");
    },
  });

  useCopilotAction({
    name: "showOrders",
    description:
      "Show open/pending orders on Kraken. Use when user asks about open orders, pending orders, limit orders, or sell orders.",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Checking orders...
          </div>
        );
      }
      if (!result) return null;
      return (
        <div className="my-2">
          <OrderTable
            data={result}
            action={<PinButton type="orders" data={result} />}
          />
        </div>
      );
    },
    handler: async () => {
      return await callTool("getOpenOrders");
    },
  });

  useCopilotAction({
    name: "showTrades",
    description:
      "Show recent trade history/fills from Kraken. Use when user asks about trades, trade history, recent fills, or past transactions.",
    parameters: [],
    render: ({ status, result }) => {
      if (status === "executing") {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading trade history...
          </div>
        );
      }
      if (!result) return null;
      return (
        <div className="my-2">
          <TradeHistory
            data={result}
            action={<PinButton type="trades" data={result} />}
          />
        </div>
      );
    },
    handler: async () => {
      return await callTool("getTradeHistory");
    },
  });

  return null;
}
