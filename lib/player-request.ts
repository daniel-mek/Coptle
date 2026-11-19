import { NextRequest, NextResponse } from "next/server";

export const privateHeaders = { "Cache-Control": "private, no-store" };


export function playerError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: privateHeaders });
}

export async function readPlayerJson(request: NextRequest, maxBody = 2048) {
  const reader = request.body?.getReader();
  if (!reader) return playerError("A request body is required.", 400);
  const decoder = new TextDecoder();
  let length = 0;
  let raw = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBody) {
        await reader.cancel().catch(() => {});
        return playerError("Request is too large.", 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    const value: unknown = JSON.parse(raw + decoder.decode());
    if (!value || typeof value !== "object" || Array.isArray(value)) return playerError("Invalid play request.", 400);
    return value as Record<string, unknown>;
  } catch {
    return playerError("Invalid JSON.", 400);
  }
}

export function playerProtocol(request: NextRequest) {
  return process.env.VERCEL === "1" ? "https:" : request.nextUrl.protocol;
}

export function validatePlayerRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const expectedOrigin = host ? `${playerProtocol(request)}//${host}` : request.nextUrl.origin;
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expectedOrigin)) {
    return playerError("Cross-origin player requests are unavailable.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return playerError("Send a JSON request.", 415);
  }
}
