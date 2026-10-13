import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createDecipheriv } from "node:crypto";
import { isOnlyUReleased } from "@/content/only-u-campaign";
import { scheduledAudioResponse } from "@/lib/scheduled-release-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function serve(request: Request, head = false) {
  if (!isOnlyUReleased()) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const key = process.env.ONLY_U_AUDIO_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const encrypted = await readFile(join(process.cwd(), "assets/releases/only-u.mp3.enc"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), encrypted.subarray(0, 12));
  decipher.setAuthTag(encrypted.subarray(12, 28));
  const audio = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]);
  return scheduledAudioResponse(audio, request.headers.get("range"), head);
}

export async function GET(request: Request) { return serve(request); }
export async function HEAD(request: Request) { return serve(request, true); }
