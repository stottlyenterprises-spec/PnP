import { NextResponse } from "next/server";

const decode = (value: string) =>
  value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export async function GET() {
  try {
    const res = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", {
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error("news");
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6).map((match, index) => {
      const item = match[1];
      const get = (tag: string) => decode(item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "");
      const source = decode(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "");
      return { id: String(index), title: get("title"), link: get("link"), published: get("pubDate"), source };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: "News is temporarily unavailable." });
  }
}
