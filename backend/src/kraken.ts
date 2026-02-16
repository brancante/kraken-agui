import crypto from "crypto";
import https from "https";
import { URL } from "url";

const API_URL = "https://api.kraken.com";

function getKrakenSignature(
  urlPath: string,
  data: string,
  secret: string
): string {
  const nonce = data.match(/nonce=(\d+)/)?.[1] || "";
  const sha256 = crypto
    .createHash("sha256")
    .update(nonce + data)
    .digest();
  const message = Buffer.concat([Buffer.from(urlPath), sha256]);
  const hmac = crypto
    .createHmac("sha512", Buffer.from(secret, "base64"))
    .update(message)
    .digest();
  return hmac.toString("base64");
}

async function krakenRequest(
  endpoint: string,
  params: Record<string, string> = {},
  isPrivate = false
): Promise<any> {
  const urlPath = `/0/${isPrivate ? "private" : "public"}/${endpoint}`;
  const nonce = Date.now().toString();

  if (isPrivate) {
    params.nonce = nonce;
  }

  const postData = new URLSearchParams(params).toString();
  const url = new URL(urlPath, API_URL);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: isPrivate ? "POST" : (Object.keys(params).length ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    if (isPrivate) {
      options.method = "POST";
      const apiKey = process.env.KRAKEN_API_KEY!;
      const apiSecret = process.env.KRAKEN_API_SECRET!;
      options.headers = {
        ...options.headers,
        "API-Key": apiKey,
        "API-Sign": getKrakenSignature(urlPath, postData, apiSecret),
      };
    }

    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.error && json.error.length > 0) {
            reject(new Error(`Kraken API error: ${json.error.join(", ")}`));
          } else {
            resolve(json.result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on("error", reject);
    if (options.method === "POST") {
      req.write(postData);
    }
    req.end();
  });
}

// Asset name mapping
const ASSET_MAP: Record<string, string> = {
  XXLM: "XLM", XXBT: "BTC", XETH: "ETH", XLTC: "LTC", XXRP: "XRP",
  XXDG: "DOGE", ZUSD: "USD", ZEUR: "EUR", ZGBP: "GBP", ZJPY: "JPY",
  ZCAD: "CAD", ZAUD: "AUD",
};

function cleanAssetName(name: string): string {
  return ASSET_MAP[name] || name;
}

export async function getBalance(): Promise<Record<string, string>> {
  const result = await krakenRequest("Balance", {}, true);
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(result)) {
    const v = parseFloat(value as string);
    if (v > 0) {
      cleaned[cleanAssetName(key)] = v.toString();
    }
  }
  return cleaned;
}

export async function getTicker(pairs: string[] = []): Promise<any> {
  if (pairs.length === 0) {
    // Get tickers for common held assets
    pairs = ["LINKUSD", "SOLUSD", "ETHUSD", "XDGUSD"];
  }
  const result = await krakenRequest("Ticker", { pair: pairs.join(",") });
  const formatted: Record<string, any> = {};
  for (const [pair, data] of Object.entries(result) as any) {
    formatted[pair] = {
      ask: data.a[0],
      bid: data.b[0],
      last: data.c[0],
      volume24h: data.v[1],
      high24h: data.h[1],
      low24h: data.l[1],
      open24h: data.o,
    };
  }
  return formatted;
}

export async function getOpenOrders(): Promise<any[]> {
  const result = await krakenRequest("OpenOrders", {}, true);
  const orders: any[] = [];
  if (result.open) {
    for (const [id, order] of Object.entries(result.open) as any) {
      orders.push({
        id,
        pair: order.descr.pair,
        type: order.descr.type,
        orderType: order.descr.ordertype,
        price: order.descr.price,
        volume: order.vol,
        status: order.status,
        openTime: new Date(order.opentm * 1000).toISOString(),
      });
    }
  }
  return orders;
}

export async function getTradeHistory(): Promise<any[]> {
  const result = await krakenRequest("TradesHistory", {}, true);
  const trades: any[] = [];
  if (result.trades) {
    for (const [id, trade] of Object.entries(result.trades) as any) {
      trades.push({
        id,
        pair: trade.pair,
        type: trade.type,
        orderType: trade.ordertype,
        price: trade.price,
        cost: trade.cost,
        fee: trade.fee,
        volume: trade.vol,
        time: new Date(trade.time * 1000).toISOString(),
      });
    }
  }
  return trades.slice(0, 20); // Last 20
}

export async function getPortfolioSummary(): Promise<any> {
  const [balances, tickers] = await Promise.all([
    getBalance(),
    getTicker(),
  ]);

  // Build price lookup
  const prices: Record<string, number> = {};
  for (const [pair, data] of Object.entries(tickers)) {
    // Extract base asset from pair name
    const usdIdx = pair.indexOf("USD");
    if (usdIdx > 0) {
      let base = pair.substring(0, usdIdx);
      // Handle Kraken naming
      if (base === "XDOGE" || base === "XDG") base = "DOGE";
      if (base === "XXBT") base = "BTC";
      if (base === "XETH") base = "ETH";
      prices[base] = parseFloat(data.last);
    }
  }

  // Known Kraken pair-to-asset mappings
  const pairAssetMap: Record<string, string> = {
    LINKUSD: "LINK", SOLUSD: "SOL", ETHUSD: "ETH", XETHZUSD: "ETH",
    XDGUSD: "DOGE", XXDGZUSD: "DOGE",
  };

  for (const [pair, data] of Object.entries(tickers)) {
    const asset = pairAssetMap[pair];
    if (asset && !prices[asset]) {
      prices[asset] = parseFloat(data.last);
    }
  }

  const assets: any[] = [];
  let totalUsd = 0;

  for (const [asset, amount] of Object.entries(balances)) {
    const qty = parseFloat(amount);
    let usdValue: number;

    if (asset === "USD") {
      usdValue = qty;
    } else if (prices[asset]) {
      usdValue = qty * prices[asset];
    } else {
      usdValue = 0; // Unknown price
    }

    totalUsd += usdValue;
    assets.push({
      asset,
      quantity: qty,
      price: prices[asset] || (asset === "USD" ? 1 : null),
      usdValue: Math.round(usdValue * 100) / 100,
    });
  }

  // Sort by USD value descending
  assets.sort((a, b) => b.usdValue - a.usdValue);

  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    assets,
    updatedAt: new Date().toISOString(),
  };
}
