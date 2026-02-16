"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { PinProvider, usePinContext } from "@/context/PinContext";
import { ChatActions } from "@/components/ChatActions";
import { PortfolioCard } from "@/components/PortfolioCard";
import { PriceCards } from "@/components/PriceCards";
import { OrderTable } from "@/components/OrderTable";
import { TradeHistory } from "@/components/TradeHistory";
import { DonutChart } from "@/components/DonutChart";

function Dashboard() {
  const { pinnedWidgets, unpinWidget } = usePinContext();

  const UnpinButton = ({ id }: { id: string }) => (
    <button
      onClick={() => unpinWidget(id)}
      className="text-xs bg-kraken-red/20 hover:bg-kraken-red/40 text-kraken-red px-2 py-1 rounded transition-colors"
      title="Unpin"
    >
      ✕ Unpin
    </button>
  );

  const renderWidget = (widget: typeof pinnedWidgets[number]) => {
    const action = <UnpinButton id={widget.id} />;
    switch (widget.type) {
      case "portfolio":
        return <PortfolioCard data={widget.data} action={action} />;
      case "prices":
        return <PriceCards data={widget.data} action={action} />;
      case "orders":
        return <OrderTable data={widget.data} action={action} />;
      case "trades":
        return <TradeHistory data={widget.data} action={action} />;
      case "donut":
        return <DonutChart data={widget.data} action={action} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🐙{" "}
          <span className="bg-gradient-to-r from-kraken-purple to-purple-400 bg-clip-text text-transparent">
            Kraken Dashboard
          </span>
        </h1>
        <p className="text-kraken-muted text-sm mt-1">
          Real-time portfolio powered by GPT-4o + AG-UI
        </p>
      </div>

      {pinnedWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="text-6xl mb-4 opacity-30">📌</div>
          <h2 className="text-xl font-semibold text-kraken-muted mb-2">
            No pinned widgets yet
          </h2>
          <p className="text-kraken-muted/70 max-w-md">
            Ask the AI assistant about your portfolio, prices, orders, or trades.
            Then pin the widgets you want to keep on your dashboard.
          </p>
          <div className="mt-6 space-y-2 text-sm text-kraken-muted/50">
            <p>💬 Try: &quot;Show my portfolio&quot;</p>
            <p>💬 Try: &quot;What are current prices?&quot;</p>
            <p>💬 Try: &quot;Show my trade history&quot;</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pinnedWidgets.map((w) => (
            <div key={w.id}>{renderWidget(w)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPanel() {
  return (
    <div className="w-[420px] border-l border-kraken-border flex flex-col bg-kraken-surface">
      <div className="p-4 border-b border-kraken-border">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          🤖 Kraken AI Assistant
        </h2>
        <p className="text-xs text-kraken-muted mt-1">
          Powered by GPT-4o — ask about your portfolio, prices, orders, or trades
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CopilotKit runtimeUrl="/api/copilotkit">
          <ChatActions />
          <CopilotChat
            className="h-full"
            instructions={`You are a Kraken crypto portfolio assistant. You MUST use the available tools to answer ANY question about the user's crypto portfolio.

CRITICAL RULES:
- ALWAYS call a tool when the user asks about portfolio, balance, holdings, value, assets → call showPortfolio
- ALWAYS call a tool when the user asks about prices, market, cost, ticker → call showPrices  
- ALWAYS call a tool when the user asks about orders, pending, limit orders → call showOrders
- ALWAYS call a tool when the user asks about trades, history, fills, transactions → call showTrades
- If unsure which tool, call showPortfolio
- NEVER just respond with text when you could use a tool instead
- After calling a tool, give a brief conversational summary of what the data shows
- Be friendly, concise, use emoji sparingly`}
            labels={{
              title: "Kraken Assistant",
              initial:
                "Hi! I'm your Kraken AI assistant powered by GPT-4o. I can help you with:\n\n• 💰 Portfolio summary & allocation\n• 💹 Live market prices\n• 📋 Open orders\n• 📜 Trade history\n\nJust ask naturally — like \"How's my portfolio doing?\" or \"What's the price of ETH?\"",
            }}
          />
        </CopilotKit>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PinProvider>
      <div className="flex h-screen">
        <Dashboard />
        <ChatPanel />
      </div>
    </PinProvider>
  );
}
