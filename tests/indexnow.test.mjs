import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const {
  indexNowEndpoint,
  isIndexNowKeyFilename,
  normalizeIndexNowUrl,
  normalizeIndexNowUrls,
  submitIndexNowUrls,
  validateIndexNowKey,
} = await import("../lib/indexnow.ts");

const validKey = "Test-Key-12345678";

test("verification route returns exact key text and genuine 404 responses", async () => {
  const previousKey = process.env.INDEXNOW_KEY;
  process.env.INDEXNOW_KEY = validKey;
  try {
    const { GET } = await import("../app/[indexnowKey]/route.ts");
    const correct = await GET(new Request(`https://broey.net/${validKey}.txt`), {
      params: Promise.resolve({ indexnowKey: `${validKey}.txt` }),
    });
    assert.equal(correct.status, 200);
    assert.equal(correct.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(correct.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(await correct.text(), validKey);

    const incorrect = await GET(new Request("https://broey.net/Wrong-Key-123.txt"), {
      params: Promise.resolve({ indexnowKey: "Wrong-Key-123.txt" }),
    });
    assert.equal(incorrect.status, 404);
  } finally {
    if (previousKey === undefined) delete process.env.INDEXNOW_KEY;
    else process.env.INDEXNOW_KEY = previousKey;
  }
});

test("validates IndexNow key length and character rules without echoing values", () => {
  assert.equal(validateIndexNowKey(validKey), validKey);
  for (const key of [undefined, "short", "invalid_key", "x".repeat(129)]) {
    assert.throws(() => validateIndexNowKey(key), (error) => {
      assert.equal(error.message.includes(key ?? "undefined"), false);
      return true;
    });
  }
});

test("matches only the exact configured key filename", () => {
  assert.equal(isIndexNowKeyFilename(`${validKey}.txt`, validKey), true);
  assert.equal(isIndexNowKeyFilename(`${validKey}-wrong.txt`, validKey), false);
  assert.equal(isIndexNowKeyFilename(validKey, validKey), false);
});

test("normalizes canonical paths and rejects noncanonical URL forms", () => {
  assert.equal(normalizeIndexNowUrl("/music/free"), "https://broey.net/music/free");
  assert.equal(normalizeIndexNowUrl("https://broey.net/about"), "https://broey.net/about");
  for (const value of [
    "https://example.com/about",
    "https://www.broey.net/about",
    "http://broey.net/about",
    "https://broey.net/about?preview=1",
    "https://broey.net/about#bio",
    "http://localhost:3000/about",
  ]) {
    assert.throws(() => normalizeIndexNowUrl(value));
  }
});

test("deduplicates URLs and rejects empty and oversized batches", () => {
  assert.deepEqual(normalizeIndexNowUrls(["/music", "https://broey.net/music"]), [
    "https://broey.net/music",
  ]);
  assert.throws(() => normalizeIndexNowUrls([]), /At least one/);
  assert.throws(
    () => normalizeIndexNowUrls(Array.from({ length: 10_001 }, (_, index) => `/page-${index}`)),
    /at most 10000/,
  );
});

test("posts the expected endpoint and canonical payload", async () => {
  let request;
  const result = await submitIndexNowUrls(["/music/free", "/music/free", "/music"], {
    key: validKey,
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response("received", { status: 200 });
    },
  });

  assert.equal(request.url, indexNowEndpoint);
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(request.init.body), {
    host: "broey.net",
    key: validKey,
    keyLocation: `https://broey.net/${validKey}.txt`,
    urlList: ["https://broey.net/music/free", "https://broey.net/music"],
  });
  assert.equal(result.classification, "received");
  assert.equal(result.urlCount, 2);
});

test("classifies documented IndexNow response statuses", async () => {
  const expected = new Map([
    [200, "received"],
    [202, "validation-pending"],
    [400, "bad-request"],
    [403, "key-validation-failed"],
    [422, "url-validation-failed"],
    [429, "rate-limited"],
  ]);
  for (const [status, classification] of expected) {
    const result = await submitIndexNowUrls(["/about"], {
      key: validKey,
      fetchImpl: async () => new Response("", { status }),
    });
    assert.equal(result.classification, classification);
    assert.equal(result.ok, status === 200 || status === 202);
  }
});

test("handles network failure and timeout without leaking the key", async () => {
  const network = await submitIndexNowUrls(["/about"], {
    key: validKey,
    fetchImpl: async () => { throw new Error(validKey); },
  });
  assert.equal(network.classification, "network-error");
  assert.equal(JSON.stringify(network).includes(validKey), false);

  const timeout = await submitIndexNowUrls(["/about"], {
    key: validKey,
    timeoutMs: 5,
    fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }),
  });
  assert.equal(timeout.classification, "timeout");
  assert.equal(JSON.stringify(timeout).includes(validKey), false);
});

test("redacts a key echoed by a provider response", async () => {
  const result = await submitIndexNowUrls(["/about"], {
    key: validKey,
    fetchImpl: async () => new Response(`bad key ${validKey}`, { status: 403 }),
  });
  assert.equal(result.responseBody, "bad key [REDACTED]");
  assert.equal(JSON.stringify(result).includes(validKey), false);
});
