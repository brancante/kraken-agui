import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool definitions for both AG-UI and OpenAI
const TOOLS = [
  {
    name: "getPortfolioSummary",
    description:
      "Get complete portfolio summary with total USD value, per-asset breakdown, and allocation. Use this when the user asks about their portfolio, holdings, total value, or wants an overview.",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "getBalance",
    description: "Get raw portfolio balances from Kraken. Use when user asks specifically about balances or how much of an asset they hold.",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "getTicker",
    description: "Get current market prices for crypto assets. Use when user asks about prices, market data, or specific coin values.",
    parameters: {
      type: "object" as const,
      properties: {
        pairs: {
          type: "array",
          items: { type: "string" },
          description: "Trading pairs like LINKUSD, SOLUSD, ETHUSD, XDGUSD. If not specified, returns common pairs.",
        },
      },
    },
  },
  {
    name: "getOpenOrders",
    description: "Get pending/open orders on Kraken. Use when user asks about open orders, pending orders, or limit orders.",
    parameters: { type: "object" as const, properties: {} },
  },
  {
    name: "getTradeHistory",
    description: "Get recent trade history/fills from Kraken. Use when user asks about recent trades, fills, or transaction history.",
    parameters: { type: "object" as const, properties: {} },
  },
];

// OpenAI function definitions
const OPENAI_TOOLS: OpenAI.ChatCompletionTool[] = TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

// Execute a tool
async function executeTool(name: string, args: any): Promise<any> {
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

// Map tool names to frontend action names (widget types)
const TOOL_TO_WIDGET: Record<string, string> = {
  getPortfolioSummary: "showPortfolio",
  getTicker: "showPrices",
  getOpenOrders: "showOrders",
  getTradeHistory: "showTrades",
};

function encodeEvent(event: any): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// AG-UI compatible endpoint with OpenAI GPT-4o
app.post("/awp", async (req, res) => {
  console.log("[AG-UI] Request received");

  const { threadId, runId, messages } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const currentRunId = runId || uuidv4();
  const currentThreadId = threadId || uuidv4();

  const write = (event: any) => {
    console.log("[AG-UI] Sending:", event.type);
    res.write(encodeEvent(event));
  };

  write({
    type: "RUN_STARTED",
    threadId: currentThreadId,
    runId: currentRunId,
  });

  try {
    // Build OpenAI messages from conversation history
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are Kraken AI, a crypto portfolio assistant connected to a live Kraken exchange account. You help users check their portfolio, view prices, review orders, and see trade history.

When the user asks about their portfolio/holdings/value, call getPortfolioSummary.
When they ask about prices/market, call getTicker.
When they ask about open/pending orders, call getOpenOrders.
When they ask about trade history/recent trades, call getTradeHistory.

CRITICAL: When you call a tool, DO NOT produce any text response at all. The data is rendered as a rich interactive UI widget automatically. Any text you add will be duplicate and ugly. Your response when using tools must contain ONLY the tool calls, zero text.

Be friendly, concise, and helpful. Use emoji sparingly.`,
      },
    ];

    // Add conversation history
    for (const msg of messages || []) {
      if (msg.role === "user") {
        let text = "";
        if (typeof msg.content === "string") {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (typeof part === "string") { text = part; break; }
            if (part?.type === "text" && part?.text) { text = part.text; break; }
          }
        } else if (msg.content?.text) {
          text = msg.content.text;
        }
        if (text) openaiMessages.push({ role: "user", content: text });
      } else if (msg.role === "assistant" && typeof msg.content === "string") {
        openaiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    console.log("[AG-UI] Sending to OpenAI, messages:", openaiMessages.length);

    // First OpenAI call - may produce tool calls
    let completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      tools: OPENAI_TOOLS,
      tool_choice: "auto",
    });

    let choice = completion.choices[0];
    let toolCallsMade: Array<{ name: string; result: any }> = [];

    // Process tool calls if any
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Add assistant message with tool calls to context
      openaiMessages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const fnArgs = JSON.parse(toolCall.function.arguments || "{}");

        console.log("[AG-UI] OpenAI wants tool:", fnName, fnArgs);

        // Execute the tool
        const result = await executeTool(fnName, fnArgs);
        toolCallsMade.push({ name: fnName, result });

        // Add tool result to context for the follow-up
        openaiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        // Emit AG-UI tool call events for frontend rendering
        const widgetAction = TOOL_TO_WIDGET[fnName];
        if (widgetAction) {
          const toolCallId = uuidv4();
          write({
            type: "TOOL_CALL_START",
            toolCallId,
            toolCallName: widgetAction,
          });
          write({
            type: "TOOL_CALL_ARGS",
            toolCallId,
            delta: JSON.stringify({ data: result }),
          });
          write({
            type: "TOOL_CALL_END",
            toolCallId,
          });
        }
      }

      // Second OpenAI call to get natural language summary
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
      });
      choice = completion.choices[0];
    }

    // Only stream text response if no tool calls were made (component-only answers)
    if (toolCallsMade.length === 0) {
      const responseText = choice.message.content || "Done!";
      const messageId = uuidv4();

      write({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });

      const chunkSize = 40;
      for (let i = 0; i < responseText.length; i += chunkSize) {
        write({
          type: "TEXT_MESSAGE_CONTENT",
          messageId,
          delta: responseText.slice(i, i + chunkSize),
        });
      }

      write({ type: "TEXT_MESSAGE_END", messageId });
    }
  } catch (err: any) {
    console.error("[AG-UI] Error:", err.message);
    const messageId = uuidv4();
    write({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });
    write({ type: "TEXT_MESSAGE_CONTENT", messageId, delta: `❌ Error: ${err.message}` });
    write({ type: "TEXT_MESSAGE_END", messageId });
  }

  write({
    type: "RUN_FINISHED",
    threadId: currentThreadId,
    runId: currentRunId,
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", tools: TOOLS.map((t) => t.name) });
});

app.listen(PORT, () => {
  console.log(`🐙 Kraken AG-UI Backend running on http://localhost:${PORT}`);
  console.log(`   AG-UI endpoint: POST /awp`);
  console.log(`   OpenAI GPT-4o: ${process.env.OPENAI_API_KEY ? "configured ✓" : "MISSING ✗"}`);
});
