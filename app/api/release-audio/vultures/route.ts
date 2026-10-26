import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { releases } from "@/content/releases";
import { isPublishedRelease } from "@/content/release-filters";
import { scheduledAudioResponse } from "@/lib/scheduled-release-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function serve(request: Request, head = false) {
  const release = releases.find((entry) => entry.slug === "vultures");
  if (!release || !isPublishedRelease(release)) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const audio = await readFile(join(process.cwd(), "assets/releases/vultures.mp3"));
  return scheduledAudioResponse(audio, request.headers.get("range"), head);
}

export async function GET(request: Request) { return serve(request); }
export async function HEAD(request: Request) { return serve(request, true); }
