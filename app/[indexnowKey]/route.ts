import { isIndexNowKeyFilename, validateIndexNowKey } from "../../lib/indexnow.ts";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ indexnowKey: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { indexnowKey } = await context.params;
  const configuredKey = process.env.INDEXNOW_KEY;

  if (!configuredKey) {
    return new Response("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  let key: string;
  try {
    key = validateIndexNowKey(configuredKey);
  } catch {
    return new Response("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  if (!isIndexNowKeyFilename(indexnowKey, key)) {
    return new Response("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  return new Response(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
