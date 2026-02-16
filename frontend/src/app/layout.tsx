import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kraken MCP + AG-UI Dashboard",
  description: "Real-time crypto portfolio dashboard powered by AG-UI protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-kraken-bg antialiased">
        {children}
      </body>
    </html>
  );
}
