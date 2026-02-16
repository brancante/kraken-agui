"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { usePinContext } from "@/context/PinContext";
import { PortfolioCard } from "./PortfolioCard";
import { DonutChart } from "./DonutChart";
import { PriceCards } from "./PriceCards";
import { OrderTable } from "./OrderTable";
import { TradeHistory } from "./TradeHistory";

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
  // Portfolio summary action
  useCopilotAction({
    name: "showPortfolio",
    description: "Display portfolio summary with allocation chart",
    parameters: [
      {
        name: "data",
        type: "object",
        description: "Portfolio data from Kraken",
      },
    ],
    render: ({ args, status }) => {
      if (!args?.data) {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading portfolio...
          </div>
        );
      }
      return (
        <div className="space-y-3 my-2 -mx-2">
          <PortfolioCard data={args.data} action={<PinButton type="portfolio" data={args.data} />} />
          <DonutChart data={args.data} action={<PinButton type="donut" data={args.data} />} />
        </div>
      );
    },
    handler: async () => {
      // Backend handles execution; this is just for rendering
    },
  });

  // Prices action
  useCopilotAction({
    name: "showPrices",
    description: "Display current market prices",
    parameters: [
      {
        name: "data",
        type: "object",
        description: "Ticker data from Kraken",
      },
    ],
    render: ({ args, status }) => {
      if (!args?.data) {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading prices...
          </div>
        );
      }
      return (
        <div className="my-2 -mx-2">
          <PriceCards data={args.data} action={<PinButton type="prices" data={args.data} />} />
        </div>
      );
    },
    handler: async () => {},
  });

  // Open orders action
  useCopilotAction({
    name: "showOrders",
    description: "Display open orders",
    parameters: [
      {
        name: "data",
        type: "object",
        description: "Open orders data from Kraken",
      },
    ],
    render: ({ args, status }) => {
      if (!args?.data) {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading orders...
          </div>
        );
      }
      // data might be an array or object with array
      const orders = Array.isArray(args.data) ? args.data : [];
      return (
        <div className="my-2 -mx-2">
          <OrderTable data={orders} action={<PinButton type="orders" data={orders} />} />
        </div>
      );
    },
    handler: async () => {},
  });

  // Trade history action
  useCopilotAction({
    name: "showTrades",
    description: "Display recent trade history",
    parameters: [
      {
        name: "data",
        type: "object",
        description: "Trade history data from Kraken",
      },
    ],
    render: ({ args, status }) => {
      if (!args?.data) {
        return (
          <div className="flex items-center gap-2 text-kraken-muted text-sm py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-kraken-purple border-t-transparent" />
            Loading trades...
          </div>
        );
      }
      const trades = Array.isArray(args.data) ? args.data : [];
      return (
        <div className="my-2 -mx-2">
          <TradeHistory data={trades} action={<PinButton type="trades" data={trades} />} />
        </div>
      );
    },
    handler: async () => {},
  });

  return null; // This component just registers actions
}
