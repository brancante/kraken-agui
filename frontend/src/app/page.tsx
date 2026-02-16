"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useState, useEffect, useCallback } from "react";
import { PortfolioCard } from "@/components/PortfolioCard";
import { PriceCards } from "@/components/PriceCards";
import { OrderTable } from "@/components/OrderTable";
import { TradeHistory } from "@/components/TradeHistory";
import { DonutChart } from "@/components/DonutChart";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

type PinnedWidget = {
  id: string;
  type: string;
  data: any;
  pinnedAt: string;
};

export default function Home() {
  const [pinnedWidgets, setPinnedWidgets] = useState<PinnedWidget[]>([]);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [tickerData, setTickerData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [tradesData, setTradesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [portfolio, ticker, orders, trades] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tool/getPortfolioSummary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/tool/getTicker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/tool/getOpenOrders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/tool/getTradeHistory`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json()),
      ]);
      if (portfolio.success) setPortfolioData(portfolio.data);
      if (ticker.success) setTickerData(ticker.data);
      if (orders.success) setOrdersData(orders.data);
      if (trades.success) setTradesData(trades.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pinWidget = (type: string, data: any) => {
    setPinnedWidgets((prev) => {
      if (prev.some((w) => w.type === type)) return prev;
      return [...prev, { id: crypto.randomUUID(), type, data, pinnedAt: new Date().toISOString() }];
    });
  };

  const unpinWidget = (id: string) => {
    setPinnedWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const renderWidget = (type: string, data: any, pinned = false, widgetId?: string) => {
    const PinButton = () =>
      !pinned ? (
        <button
          onClick={() => pinWidget(type, data)}
          className="text-xs bg-kraken-purple/20 hover:bg-kraken-purple/40 text-kraken-purple px-2 py-1 rounded transition-colors"
          title="Pin to dashboard"
        >
          📌 Pin
        </button>
      ) : (
        <button
          onClick={() => unpinWidget(widgetId!)}
          className="text-xs bg-kraken-red/20 hover:bg-kraken-red/40 text-kraken-red px-2 py-1 rounded transition-colors"
          title="Unpin"
        >
          ✕
        </button>
      );

    switch (type) {
      case "portfolio":
        return <PortfolioCard data={data} action={<PinButton />} />;
      case "prices":
        return <PriceCards data={data} action={<PinButton />} />;
      case "orders":
        return <OrderTable data={data} action={<PinButton />} />;
      case "trades":
        return <TradeHistory data={data} action={<PinButton />} />;
      case "donut":
        return <DonutChart data={data} action={<PinButton />} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      {/* LEFT PANEL - Dashboard */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🐙 <span className="bg-gradient-to-r from-kraken-purple to-purple-400 bg-clip-text text-transparent">Kraken Dashboard</span>
          </h1>
          <p className="text-kraken-muted text-sm mt-1">Real-time portfolio powered by MCP + AG-UI</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-kraken-purple border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Default dashboard widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {portfolioData && renderWidget("portfolio", portfolioData)}
              {portfolioData && renderWidget("donut", portfolioData)}
            </div>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {tickerData && renderWidget("prices", tickerData)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {ordersData && renderWidget("orders", ordersData)}
              {tradesData && renderWidget("trades", tradesData)}
            </div>

            {/* Pinned widgets */}
            {pinnedWidgets.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📌 Pinned
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pinnedWidgets.map((w) => (
                    <div key={w.id}>{renderWidget(w.type, w.data, true, w.id)}</div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* RIGHT PANEL - Chat */}
      <div className="w-[420px] border-l border-kraken-border flex flex-col bg-kraken-surface">
        <div className="p-4 border-b border-kraken-border">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            🤖 Kraken AI Assistant
          </h2>
          <p className="text-xs text-kraken-muted mt-1">
            Ask about your portfolio, prices, orders, or trades
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <CopilotKit
            runtimeUrl="/api/copilotkit"
            agent="kraken"
          >
            <CopilotChat
              className="h-full"
              instructions="You are a Kraken crypto portfolio assistant. Help users view their portfolio, check prices, review orders, and see trade history. Always be helpful and format data clearly."
              labels={{
                title: "Kraken Assistant",
                initial: "Hi! I can help you check your Kraken portfolio. Try asking:\n\n• \"Show my portfolio summary\"\n• \"What are current prices?\"\n• \"Show my open orders\"\n• \"Show my trade history\"",
              }}
            />
          </CopilotKit>
        </div>
      </div>
    </div>
  );
}
