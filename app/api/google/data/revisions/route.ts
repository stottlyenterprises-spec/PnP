import { NextResponse } from "next/server";
import { googleAccessToken } from "../../token";

const FILE_NAME = "progress-not-perfection.json";

type Envelope = {
  kind: "deeds-data";
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: Record<string, unknown>;
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
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("drive_permission");
  return (await response.json()).files?.[0] as { id: string; modifiedTime: string } | undefined;
}

async function readRevision(token: string, fileId: string, revisionId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) return null;
  const payload = await response.json() as unknown;
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.kind !== "deeds-data" || !record.data || typeof record.data !== "object" || Array.isArray(record.data)) return null;
  return record as unknown as Envelope;
}

function collectionLength(data: Record<string, unknown>, key: string) {
  return Array.isArray(data[key]) ? data[key].length : 0;
}

function summarize(envelope: Envelope, id: string, modifiedTime: string) {
  const data = envelope.data;
  const tasks = collectionLength(data, "tasks");
  const health = collectionLength(data, "health");
  const interviews = collectionLength(data, "mornings");
  const goals = collectionLength(data, "outcomes");
  const journal = collectionLength(data, "journal");
  const relationships = collectionLength(data, "relationships");
  return {
    id,
    modifiedTime,
    updatedAt: envelope.updatedAt,
    revision: envelope.revision,
    tasks,
    health,
    interviews,
    goals,
    journal,
    relationships,
    items: tasks + health + interviews + goals + journal + relationships,
  };
}

export async function GET() {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  try {
    const file = await findFile(token);
    if (!file) return NextResponse.json({ revisions: [] });
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/revisions?pageSize=200&fields=revisions(id,modifiedTime,size)`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!response.ok) throw new Error("revision_list_failed");
    const metadata = (await response.json()).revisions as { id: string; modifiedTime: string; size?: string }[] | undefined;
    const candidates = (metadata || []).slice(-40).reverse();
    const revisions = [];
    for (const candidate of candidates) {
      const envelope = await readRevision(token, file.id, candidate.id);
      if (!envelope) continue;
      const summary = summarize(envelope, candidate.id, candidate.modifiedTime);
      if (summary.items > 0) revisions.push(summary);
      if (revisions.length >= 15) break;
    }
    return NextResponse.json({ revisions });
  } catch {
    return NextResponse.json({ error: "Cloud revision history is unavailable. Reconnect Google and try again." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  const token = await googleAccessToken(0);
  if (!token) return NextResponse.json({ error: "Connect Google first." }, { status: 401 });
  try {
    const { revisionId } = await request.json() as { revisionId?: string };
    if (!revisionId) return NextResponse.json({ error: "Choose a revision first." }, { status: 400 });
    const file = await findFile(token);
    if (!file) return NextResponse.json({ error: "No cloud record was found." }, { status: 404 });
    const envelope = await readRevision(token, file.id, revisionId);
    if (!envelope) return NextResponse.json({ error: "That cloud revision could not be read." }, { status: 404 });
    const summary = summarize(envelope, revisionId, envelope.updatedAt);
    if (summary.items === 0) return NextResponse.json({ error: "Blank revisions cannot be restored." }, { status: 400 });
    return NextResponse.json({ payload: envelope, summary });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "The recovery request was invalid." }, { status: 400 });
    return NextResponse.json({ error: "Cloud revision recovery is unavailable. Reconnect Google and try again." }, { status: 403 });
  }
}
