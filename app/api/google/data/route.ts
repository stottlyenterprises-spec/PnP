import { NextResponse } from "next/server";
import { googleAccessToken } from "../token";

const FILE_NAME = "progress-not-perfection.json";
const DATA_SCHEMA_VERSION = 3;

type Envelope = {
  kind: "deeds-data";
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: unknown;
};

async function findFile(token: string) {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.search = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${FILE_NAME}' and trashed=false`,
    fields: "files(id,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "10",
  }).toString();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("drive_permission");
  return (await res.json()).files?.[0] as { id: string; modifiedTime: string } | undefined;
}

async function readFile(token: string, id: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("download_failed");
  return res.json() as Promise<unknown>;
}

function toEnvelope(payload: unknown): Envelope | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.kind === "deeds-data" && typeof record.revision === "number" && "data" in record) {
    return record as Envelope;
  }
  if ("data" in record) {
    return {
      kind: "deeds-data",
      schemaVersion: 1,
      revision: 0,
      updatedAt: typeof record.savedAt === "string" ? record.savedAt : new Date(0).toISOString(),
      deviceId: "legacy-cloud",
      data: record.data,
    };
  }
  return null;
}

function recordItemCount(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
  const record = data as Record<string, unknown>;
  const collections = [
    "tasks", "taskCategories", "health", "mentalRecords", "revenue", "mornings",
    "relationships", "relationshipProfiles", "journal", "dailyHistory", "outcomes",
    "opportunities", "decisions", "reviews", "captures", "customTaskLists",
  ];
  return collections.reduce((total, key) => total + (Array.isArray(record[key]) ? record[key].length : 0), 0);
}

export async function GET() {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  try {
    const file = await findFile(token);
    if (!file) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, fileId: file.id, modifiedTime: file.modifiedTime, payload: await readFile(token, file.id) });
  } catch {
    return NextResponse.json({ error: "Reconnect Google to enable private device sync." }, { status: 403 });
  }
}

export async function POST(req: Request) {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  try {
    const request = await req.json() as { baseRevision?: number; force?: boolean; deviceId?: string; updatedAt?: string; data?: unknown };
    if (!("data" in request)) return NextResponse.json({ error: "No D.E.E.D.S. data was supplied." }, { status: 400 });
    const file = await findFile(token);
    const current = file ? toEnvelope(await readFile(token, file.id)) : null;
    const currentRevision = current?.revision || 0;
    const baseRevision = Number(request.baseRevision) || 0;
    if (current && currentRevision > 0 && recordItemCount(current.data) > 0 && baseRevision === 0) {
      return NextResponse.json({
        error: "This device must restore the current D.E.E.D.S. record before it can save.",
        conflict: true,
        protected: true,
        payload: current,
      }, { status: 409 });
    }
    if (current && recordItemCount(current.data) > 0 && recordItemCount(request.data) === 0) {
      return NextResponse.json({
        error: "A blank profile cannot replace a populated D.E.E.D.S. record.",
        conflict: true,
        protected: true,
        payload: current,
      }, { status: 409 });
    }
    if (file && !request.force && currentRevision !== baseRevision) {
      return NextResponse.json({
        error: "Cloud data changed on another device.",
        conflict: true,
        payload: current,
      }, { status: 409 });
    }
    const envelope: Envelope = {
      kind: "deeds-data",
      schemaVersion: DATA_SCHEMA_VERSION,
      revision: currentRevision + 1,
      updatedAt: request.updatedAt || new Date().toISOString(),
      deviceId: request.deviceId || "unknown-device",
      data: request.data,
    };
    const text = JSON.stringify(envelope);
    if (text.length > 2_000_000) return NextResponse.json({ error: "D.E.E.D.S. data is too large to sync." }, { status: 413 });
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
    return NextResponse.json({ saved: true, file: await res.json(), payload: envelope });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "The save request was invalid." }, { status: 400 });
    return NextResponse.json({ error: "Reconnect Google to enable private device sync." }, { status: 403 });
  }
}
