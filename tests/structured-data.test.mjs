import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { trackRegistryByReleaseSlug } = await import(
  "../content/musicRegistry.generated.ts"
);
const { releases } = await import("../content/releases.ts");
const {
  artistEntityId,
  createArtistStructuredData,
  createReleaseBreadcrumbStructuredData,
  createReleaseStructuredData,
  createWebsiteStructuredData,
  releaseEntityId,
  schemaContext,
  serializeJsonLd,
  websiteEntityId,
} = await import("../content/structured-data.ts");

const productionOrigin = "https://broey.net";

const recursivelyFind = (value, predicate, matches = []) => {
  if (Array.isArray(value)) {
    for (const item of value) recursivelyFind(item, predicate, matches);
    return matches;
  }

  if (value && typeof value === "object") {
    if (predicate(value)) matches.push(value);
    for (const item of Object.values(value)) recursivelyFind(item, predicate, matches);
  }

  return matches;
};

const release = (slug) => {
  const match = releases.find((entry) => entry.slug === slug);
  assert.ok(match, `missing release fixture: ${slug}`);
  return match;
};

test("artist schema defines one stable Person identity for Joe Montaro and Broey", () => {
  const artist = createArtistStructuredData();

  assert.equal(artist["@context"], schemaContext);
  assert.equal(artist["@type"], "Person");
  assert.equal(artist["@id"], `${productionOrigin}/#artist`);
  assert.equal(artist["@id"], artistEntityId);
  assert.equal(artist.name, "Joe Montaro");
  assert.equal(artist.alternateName, "Broey.");
  assert.equal(artist.url, `${productionOrigin}/about`);
  assert.match(artist.image, /^https:\/\/broey\.net\//);
  assert.deepEqual(artist.homeLocation, {
    "@type": "Place",
    name: "Scranton, Pennsylvania",
  });
  assert.ok(artist.sameAs.length >= 1);
  assert.equal(new Set(artist.sameAs).size, artist.sameAs.length);
});

test("homepage schema defines one stable WebSite entity without a SearchAction", () => {
  const website = createWebsiteStructuredData();
  const serialized = serializeJsonLd(website);

  assert.equal(website["@context"], schemaContext);
  assert.equal(website["@type"], "WebSite");
  assert.equal(website["@id"], websiteEntityId);
  assert.equal(website["@id"], `${productionOrigin}/#website`);
  assert.equal(website.url, `${productionOrigin}/`);
  assert.equal(website.name, "Broey.");
  assert.equal(website.alternateName, "Broey");
  assert.deepEqual(website.publisher, { "@id": artistEntityId });
  assert.doesNotMatch(serialized, /SearchAction/);
});

test("all indexable releases have factual, connected, clean structured data", () => {
  const indexable = releases.filter(showReleaseInSitemap);
  const schemas = indexable.map(createReleaseStructuredData);

  assert.equal(indexable.length, 15);
  assert.equal(new Set(schemas.map((schema) => schema["@id"])).size, schemas.length);

  for (const [index, schema] of schemas.entries()) {
    const source = indexable[index];
    const expectedUrl = `${productionOrigin}/music/${source.slug}`;
    const serialized = serializeJsonLd(schema);

    assert.equal(schema["@context"], schemaContext);
    assert.ok(["MusicRecording", "MusicAlbum"].includes(schema["@type"]));
    assert.equal(schema["@id"], `${expectedUrl}#release`);
    assert.equal(schema["@id"], releaseEntityId(source));
    assert.equal(schema.url, expectedUrl);
    assert.equal(schema.mainEntityOfPage["@id"], expectedUrl);
    assert.deepEqual(schema.mainEntityOfPage.isPartOf, { "@id": websiteEntityId });
    assert.ok(schema.description);
    assert.doesNotMatch(serialized, /undefined/);
    assert.doesNotMatch(serialized, /:null(?:[,}])/);
    assert.equal(JSON.stringify(JSON.parse(serialized)), serialized);

    if (schema.datePublished) {
      assert.ok(
        schema.datePublished === source.releaseDate ||
          schema.datePublished === String(source.year),
      );
    }

    if (schema.image) {
      assert.match(schema.image, /^https:\/\/broey\.net\//);
      assert.ok(source.coverImage);
    }

    const broeyGroups = recursivelyFind(
      schema,
      (entity) =>
        entity["@type"] === "MusicGroup" &&
        typeof entity.name === "string" &&
        entity.name.toLowerCase().replaceAll(".", "") === "broey",
    );
    assert.equal(broeyGroups.length, 0, `${source.slug} redefines Broey as MusicGroup`);

    const broeyReferences = recursivelyFind(
      schema.byArtist,
      (entity) => entity["@id"] === artistEntityId,
    );
    assert.ok(broeyReferences.length >= 1, `${source.slug} must link the artist entity`);
  }
});

test("release types and role handling cover singles, projects, remixes, and collaborations", () => {
  const single = createReleaseStructuredData(release("stereo-luv"));
  const project = createReleaseStructuredData(release("dancing-dumpster-fire"));
  const remixProject = createReleaseStructuredData(release("fragments-remixes"));
  const collaboration = createReleaseStructuredData(release("warning"));
  const internalRemix = createReleaseStructuredData(release("4u-vip"));
  const remixedTrack = createReleaseStructuredData(
    release("numbers-tom-ecko-remix"),
  );

  assert.equal(single["@type"], "MusicRecording");
  assert.equal(single.isrcCode, "QZTGW2406985");
  assert.deepEqual(single.producer, { "@id": artistEntityId });
  assert.equal(single.audio["@type"], "AudioObject");
  assert.equal(single.duration, "PT5M12S");

  assert.equal(project["@type"], "MusicAlbum");
  assert.equal(project.numTracks, 7);
  assert.equal(project.track.length, 7);
  assert.equal(project.track[0].inAlbum["@id"], project["@id"]);

  assert.equal(remixProject["@type"], "MusicAlbum");
  assert.equal(remixProject.numTracks, 7);
  assert.ok(remixProject.track[0].contributor.length >= 1);

  assert.ok(Array.isArray(collaboration.byArtist));
  assert.ok(collaboration.byArtist.some((artist) => artist["@id"] === artistEntityId));
  assert.ok(collaboration.byArtist.some((artist) => artist.name === "Cryztal Grid"));

  assert.equal(internalRemix["@type"], "MusicRecording");
  assert.equal(internalRemix.isrcCode, "QZTGW2405547");
  assert.equal(
    internalRemix.inAlbum["@id"],
    `${productionOrigin}/music/dancing-dumpster-fire#release`,
  );

  assert.deepEqual(remixedTrack.byArtist, { "@id": artistEntityId });
  assert.ok(remixedTrack.contributor.some((artist) => artist.name === "tom_ecko"));
});

test("ISRC values are only serialized from controlled registry data", () => {
  const sourceIsrcs = new Set(
    Object.values(trackRegistryByReleaseSlug)
      .flat()
      .map((track) => track.isrc)
      .filter(Boolean),
  );

  for (const source of releases) {
    const schema = createReleaseStructuredData(source);
    const isrcValues = recursivelyFind(
      schema,
      (entity) => typeof entity.isrcCode === "string",
    ).map((entity) => entity.isrcCode);

    for (const isrc of isrcValues) {
      assert.ok(sourceIsrcs.has(isrc), `${source.slug} has an unproven ISRC`);
    }
  }
});

test("release breadcrumbs match the visible Home / Music / release hierarchy", () => {
  for (const source of releases.filter(showReleaseInSitemap)) {
    const breadcrumb = createReleaseBreadcrumbStructuredData(source);
    const items = breadcrumb.itemListElement;

    assert.equal(breadcrumb["@context"], schemaContext);
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.deepEqual(items.map((item) => item.position), [1, 2, 3]);
    assert.deepEqual(items.map((item) => item.name), ["Home", "Music", source.title]);
    assert.deepEqual(items.map((item) => item.item), [
      `${productionOrigin}/`,
      `${productionOrigin}/music`,
      `${productionOrigin}/music/${source.slug}`,
    ]);
  }
});
