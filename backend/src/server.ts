import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import {
  getBalance,
  getTicker,
  getOpenOrders,
  getTradeHistory,
  getPortfolioSummary,
} from "./kraken.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Tool definitions
const TOOLS = [
  {
    name: "getBalance",
    description: "Get current portfolio balances from Kraken",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getTicker",
    description: "Get current prices for crypto assets",
    parameters: {
      type: "object",
      properties: {
        pairs: {
          type: "array",
          items: { type: "string" },
          description: "Trading pairs like LINKUSD, SOLUSD, ETHUSD",
        },
      },
    },
  },
  {
    name: "getOpenOrders",
    description: "Get pending/open orders on Kraken",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getTradeHistory",
    description: "Get recent trade history/fills from Kraken",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getPortfolioSummary",
    description:
      "Get complete portfolio summary with total USD value and per-asset breakdown",
    parameters: { type: "object", properties: {} },
  },
];

// Execute a tool
async function executeTool(
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case "getBalance":
      return await getBalance();
    case "getTicker":
      return await getTicker(args?.pairs);
    case "getOpenOrders":
      return await getOpenOrders();
    case "getTradeHistory":
      return await getTradeHistory();
    case "getPortfolioSummary":
      return await getPortfolioSummary();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// SSE helper
function sseWrite(res: express.Response, event: any) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Simple AI-like response generator based on tool results
function generateResponse(toolName: string, result: any): string {
  switch (toolName) {
    case "getBalance": {
      const entries = Object.entries(result);
      let text = "📊 **Portfolio Balances**\n\n";
      for (const [asset, amount] of entries) {
        text += `• **${asset}**: ${parseFloat(amount as string).toLocaleString("en-US", { maximumFractionDigits: 8 })}\n`;
      }
      return text;
    }
    case "getTicker": {
      let text = "💹 **Current Prices**\n\n";
      for (const [pair, data] of Object.entries(result) as any) {
        const last = parseFloat(data.last);
        const open = parseFloat(data.open24h);
        const change = ((last - open) / open) * 100;
        const arrow = change >= 0 ? "🟢" : "🔴";
        text += `${arrow} **${pair}**: $${last.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)\n`;
      }
      return text;
    }
    case "getOpenOrders": {
      if (result.length === 0) return "📋 **Open Orders**\n\nNo open orders found.";
      let text = "📋 **Open Orders**\n\n";
      for (const order of result) {
        text += `• **${order.pair}** — ${order.type.toUpperCase()} ${order.volume} @ $${order.price} (${order.orderType}) — *${order.status}*\n`;
      }
      return text;
    }
    case "getTradeHistory": {
      if (result.length === 0) return "📜 **Trade History**\n\nNo recent trades found.";
      let text = "📜 **Recent Trades**\n\n";
      for (const trade of result.slice(0, 10)) {
        text += `• **${trade.pair}** — ${trade.type.toUpperCase()} ${trade.volume} @ $${trade.price} ($${trade.cost}) — ${trade.time}\n`;
      }
      return text;
    }
    case "getPortfolioSummary": {
      let text = `💰 **Portfolio Summary**\n\n**Total Value: $${result.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}**\n\n`;
      for (const a of result.assets) {
        const pct = result.totalUsd > 0 ? ((a.usdValue / result.totalUsd) * 100).toFixed(1) : "0";
        text += `• **${a.asset}**: ${a.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })} — $${a.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${pct}%)\n`;
      }
      text += `\n_Updated: ${result.updatedAt}_`;
      return text;
    }
    default:
      return JSON.stringify(result, null, 2);
  }
}

// Determine which tool to call based on user message
function detectTool(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("summary") || lower.includes("portfolio") || lower.includes("overview") || lower.includes("total"))
    return "getPortfolioSummary";
  if (lower.includes("balance") || lower.includes("holdings"))
    return "getBalance";
  if (lower.includes("price") || lower.includes("ticker") || lower.includes("market"))
    return "getTicker";
  if (lower.includes("open order") || lower.includes("pending"))
    return "getOpenOrders";
  if (lower.includes("trade") || lower.includes("history") || lower.includes("fill"))
    return "getTradeHistory";
  return null;
}

// AG-UI compatible endpoint
app.post("/awp", async (req, res) => {
  const { threadId, runId, messages } = req.body;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const currentRunId = runId || uuidv4();
  const currentThreadId = threadId || uuidv4();

  // RUN_STARTED
  sseWrite(res, {
    type: "RUN_STARTED",
    threadId: currentThreadId,
    runId: currentRunId,
    status: "running",
  });

  try {
    // Get the last user message
    const userMsg = [...(messages || [])].reverse().find((m: any) => m.role === "user");
    const userText = userMsg?.content || "portfolio summary";

    // Detect tool
    const toolName = detectTool(userText) || "getPortfolioSummary";
    const toolCallId = uuidv4();

    // Execute tool first (before announcing it)
    const toolResult = await executeTool(toolName, {});

    // Generate text response
    const responseText = generateResponse(toolName, toolResult);
    const messageId = uuidv4();

    // TEXT_MESSAGE_START
    sseWrite(res, {
      type: "TEXT_MESSAGE_START",
      messageId,
      role: "assistant",
    });

    // Stream in chunks
    const chunkSize = 20;
    for (let i = 0; i < responseText.length; i += chunkSize) {
      const chunk = responseText.slice(i, i + chunkSize);
      sseWrite(res, {
        type: "TEXT_MESSAGE_CONTENT",
        messageId,
        delta: chunk,
      });
      await new Promise((r) => setTimeout(r, 15));
    }

    // TEXT_MESSAGE_END
    sseWrite(res, {
      type: "TEXT_MESSAGE_END",
      messageId,
    });
  } catch (err: any) {
    const messageId = uuidv4();
    sseWrite(res, { type: "TEXT_MESSAGE_START", messageId, role: "assistant" });
    sseWrite(res, {
      type: "TEXT_MESSAGE_CONTENT",
      messageId,
      delta: `❌ Error: ${err.message}`,
    });
    sseWrite(res, { type: "TEXT_MESSAGE_END", messageId });
  }

  // RUN_FINISHED
  sseWrite(res, {
    type: "RUN_FINISHED",
    threadId: currentThreadId,
    runId: currentRunId,
    status: "complete",
  });

  res.end();
});

// Direct tool API for frontend widgets
app.get("/api/tools", (_req, res) => {
  res.json(TOOLS);
});

app.post("/api/tool/:name", async (req, res) => {
  try {
    const result = await executeTool(req.params.name, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", tools: TOOLS.map((t) => t.name) });
});

app.listen(PORT, () => {
  console.log(`🐙 Kraken AG-UI Backend running on http://localhost:${PORT}`);
  console.log(`   AG-UI endpoint: POST /awp`);
  console.log(`   Tools API: POST /api/tool/:name`);
});
