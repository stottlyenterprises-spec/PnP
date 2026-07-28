import { NextResponse } from "next/server";
import { googleAccessToken } from "../token";

const FILE_NAME = "progress-not-perfection.json";

async function findFile(token: string) {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.search = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${FILE_NAME}' and trashed=false`,
    fields: "files(id,modifiedTime)",
    pageSize: "1",
  }).toString();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("drive_permission");
  return (await res.json()).files?.[0] as { id: string; modifiedTime: string } | undefined;
}

export async function GET() {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  try {
    const file = await findFile(token);
    if (!file) return NextResponse.json({ found: false });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("download_failed");
    return NextResponse.json({ found: true, fileId: file.id, modifiedTime: file.modifiedTime, payload: await res.json() });
  } catch {
    return NextResponse.json({ error: "Reconnect Google to enable private device sync." }, { status: 403 });
  }
}

export async function POST(req: Request) {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  const text = await req.text();
  if (text.length > 2_000_000) return NextResponse.json({ error: "PNP data is too large to sync." }, { status: 413 });
  try {
    JSON.parse(text);
    const file = await findFile(token);
    const boundary = `pnp_${crypto.randomUUID()}`;
    const metadata = file ? { name: FILE_NAME } : { name: FILE_NAME, parents: ["appDataFolder"] };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${boundary}--`;
    const endpoint = file
      ? `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=multipart`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const res = await fetch(endpoint, {
      method: file ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) throw new Error("upload_failed");
    return NextResponse.json({ saved: true, file: await res.json() });
  } catch {
    return NextResponse.json({ error: "Reconnect Google to enable private device sync." }, { status: 403 });
  }
}
