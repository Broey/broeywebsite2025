import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const { imageDimensionsForPath } = await import("../content/image-metadata.ts");
const { staticPageMetadata, staticSitemapRoutes } = await import(
  "../content/page-metadata.ts"
);
const {
  releaseSearchDescription,
  releaseSearchTitle,
} = await import("../content/release-metadata.ts");
const { releases } = await import("../content/releases.ts");
const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { createPageMetadata } = await import("../content/seo.ts");

const expectedStaticRoutes = [
  "/",
  "/music",
  "/about",
  "/contact",
  "/merch",
  "/press",
  "/privacy",
];

const absoluteTitle = (definition) => {
  const metadata = createPageMetadata(definition);
  return typeof metadata.title === "object" ? metadata.title.absolute : metadata.title;
};

test("all static sitemap routes have complete, unique metadata", () => {
  assert.deepEqual(staticSitemapRoutes, expectedStaticRoutes);

  const definitions = Object.values(staticPageMetadata);
  const titles = definitions.map(absoluteTitle);
  const descriptions = definitions.map(({ description }) => description);

  assert.equal(new Set(titles).size, definitions.length);
  assert.equal(new Set(descriptions).size, definitions.length);

  for (const definition of definitions) {
    assert.ok(absoluteTitle(definition));
    assert.ok(definition.description);

    const metadata = createPageMetadata(definition);
    const expectedCanonical = new URL(definition.path, "http://localhost:3000").toString();

    assert.equal(metadata.alternates?.canonical, expectedCanonical);
    assert.equal(metadata.openGraph?.url, expectedCanonical);
    assert.equal(metadata.openGraph?.description, definition.description);
    assert.equal(metadata.twitter?.description, definition.description);
    assert.notEqual(metadata.robots && "index" in metadata.robots ? metadata.robots.index : true, false);
  }
});

test("static social images use valid application paths and known dimensions", () => {
  for (const definition of Object.values(staticPageMetadata)) {
    if (!definition.image) {
      continue;
    }

    assert.match(definition.image.url, /^\/[a-z0-9/_\-.]+$/i);
    assert.deepEqual(imageDimensionsForPath(definition.image.url), {
      width: definition.image.width,
      height: definition.image.height,
    });
    assert.ok(definition.image.alt);
  }
});

test("all indexable releases have unique search metadata and valid cover sources", () => {
  const indexableReleases = releases.filter(showReleaseInSitemap);
  assert.ok(indexableReleases.length > 0);

  const titles = indexableReleases.map(releaseSearchTitle);
  const descriptions = indexableReleases.map(releaseSearchDescription);

  assert.equal(new Set(titles).size, indexableReleases.length);
  assert.equal(new Set(descriptions).size, indexableReleases.length);

  for (const release of indexableReleases) {
    const title = releaseSearchTitle(release);
    const description = releaseSearchDescription(release);
    const path = `/music/${release.slug}`;
    const image = release.coverImage && imageDimensionsForPath(release.coverImage)
      ? {
          url: release.coverImage,
          ...imageDimensionsForPath(release.coverImage),
          alt: release.coverAlt ?? `${release.title} cover art`,
        }
      : undefined;
    const metadata = createPageMetadata({
      title,
      description,
      path,
      image,
      absoluteTitle: true,
    });
    const expectedCanonical = `http://localhost:3000${path}`;

    assert.ok(title);
    assert.ok(description);
    assert.doesNotMatch(title, /\| Broey\.$/);
    assert.equal(metadata.alternates?.canonical, expectedCanonical);
    assert.equal(metadata.openGraph?.url, expectedCanonical);
    assert.notEqual(metadata.robots && "index" in metadata.robots ? metadata.robots.index : true, false);

    if (release.coverImage) {
      assert.match(release.coverImage, /^\//);
      assert.ok(imageDimensionsForPath(release.coverImage));
      assert.equal(metadata.openGraph?.images?.[0] && "url" in metadata.openGraph.images[0]
        ? metadata.openGraph.images[0].url
        : undefined, release.coverImage);
    }
  }
});

test("non-sitemap release metadata preserves the existing noindex policy", () => {
  const internalRelease = releases.find(
    (release) => release.slug === "4u-vip" && !showReleaseInSitemap(release),
  );

  assert.ok(internalRelease);

  const metadata = createPageMetadata({
    title: releaseSearchTitle(internalRelease),
    description: releaseSearchDescription(internalRelease),
    path: `/music/${internalRelease.slug}`,
    absoluteTitle: true,
    indexable: false,
  });

  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
