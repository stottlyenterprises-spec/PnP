import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("symbols") || "";
  const symbols = input
    .toUpperCase()
    .split(",")
    .map(symbol => symbol.trim())
    .filter(symbol => /^[A-Z0-9.^-]{1,12}$/.test(symbol))
    .slice(0, 8);

  const quotes = await Promise.all(
    symbols.map(async symbol => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
          { next: { revalidate: 300 }, headers: { "User-Agent": "Mozilla/5.0 DEEDS" } }
        );
        if (!res.ok) return null;
        const meta = (await res.json()).chart?.result?.[0]?.meta;
        if (!meta?.regularMarketPrice) return null;
        const previous = Number(meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice);
        const price = Number(meta.regularMarketPrice);
        return {
          symbol: meta.symbol || symbol,
          price,
          change: price - previous,
          percent: previous ? ((price - previous) / previous) * 100 : 0,
          currency: meta.currency || "USD",
          marketState: meta.marketState || "",
        };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({ quotes: quotes.filter(Boolean) });
}
