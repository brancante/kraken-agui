"use client";

import { ReactNode } from "react";

interface Props {
  data: Array<{
    id: string;
    pair: string;
    type: string;
    orderType: string;
    price: string;
    volume: string;
    status: string;
    openTime: string;
  }>;
  action?: ReactNode;
}

export function OrderTable({ data, action }: Props) {
  return (
    <div className="bg-kraken-card rounded-xl p-5 border border-kraken-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-kraken-muted uppercase tracking-wider">
          📋 Open Orders
        </h3>
        {action}
      </div>
      {data.length === 0 ? (
        <p className="text-kraken-muted text-sm py-4 text-center">No open orders</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-kraken-muted text-xs border-b border-kraken-border">
                <th className="text-left py-2">Pair</th>
                <th className="text-left py-2">Side</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Volume</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id} className="border-b border-kraken-border/50">
                  <td className="py-2 text-white font-medium">{order.pair}</td>
                  <td className={`py-2 ${order.type === "buy" ? "text-kraken-green" : "text-kraken-red"}`}>
                    {order.type.toUpperCase()}
                  </td>
                  <td className="py-2 text-kraken-muted">{order.orderType}</td>
                  <td className="py-2 text-right text-white">${order.price}</td>
                  <td className="py-2 text-right text-white">{order.volume}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-kraken-purple/20 text-kraken-purple">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
