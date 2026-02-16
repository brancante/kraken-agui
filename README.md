# 🐙 Kraken MCP + AG-UI Dashboard

Real-time crypto portfolio dashboard powered by Kraken API, MCP tools, and the AG-UI protocol with CopilotKit.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js + CopilotKit + Tailwind) │ :3000
│  ┌───────────────┬─────────────────────┐    │
│  │  Dashboard     │  Chat (AG-UI)       │    │
│  │  - Portfolio   │  - Natural language  │    │
│  │  - Donut chart │  - Streaming UI     │    │
│  │  - Prices      │  - Rich cards       │    │
│  │  - Orders      │  - 📌 Pin to dash   │    │
│  │  - Trades      │                     │    │
│  └───────────────┴─────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ AG-UI Protocol (SSE)
┌──────────────────▼──────────────────────────┐
│  Backend (Express + AG-UI + Kraken MCP)     │ :3001
│  - AG-UI SSE endpoint (/awp)               │
│  - REST tool API (/api/tool/:name)         │
│  - Kraken API integration (read-only)      │
│  Tools: getBalance, getTicker,             │
│         getOpenOrders, getTradeHistory,     │
│         getPortfolioSummary                │
└─────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure API keys
cp .env.example backend/.env
# Edit backend/.env with your Kraken API keys

# 3. Run both servers
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `KRAKEN_API_KEY` | `backend/.env` | Kraken API key (read-only) |
| `KRAKEN_API_SECRET` | `backend/.env` | Kraken API secret |
| `PORT` | `backend/.env` | Backend port (default: 3001) |
| `BACKEND_URL` | `frontend/.env.local` | Backend URL for SSR |
| `NEXT_PUBLIC_BACKEND_URL` | `frontend/.env.local` | Backend URL for client |

## Features

- **Real-time portfolio data** from Kraken API
- **AG-UI protocol** for streaming agent responses
- **CopilotKit chat** with natural language queries
- **Dark theme** inspired by Kraken's aesthetic
- **Donut chart** for asset allocation
- **Price cards** with 24h change indicators
- **Order table** and **trade history**
- **Pin widgets** from chat to dashboard

## Tech Stack

- **Frontend:** Next.js 15, React 19, CopilotKit, Tailwind CSS, Recharts
- **Backend:** Express, AG-UI Core, Kraken REST API
- **Protocol:** AG-UI (SSE streaming events)
