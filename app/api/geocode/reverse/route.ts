import { NextRequest, NextResponse } from "next/server";

export type GeocodePayload = {
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  displayName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  source: string;
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "WorthKart/1.0 (checkout-address; support@worthkart.in)",
  "Accept-Language": "en-IN,en",
};

function looksLikeBlockOrSector(value: string): boolean {
  return /\b(block|sector|phase|pocket|colony|enclave|extension|ext\.?|nagar|vihar)\b/i.test(
    value
  );
}

function isVagueLocality(value: string): boolean {
  return /^(mamura|barola|dadri|chalera|sorkha|haraula|gejha|nithari|village|tehsil|goyal colony|selected location)$/i.test(
    value.trim()
  );
}

function cleanBlockTitle(value: string): string {
  return value
    .replace(/\s+road$/i, "")
    .replace(/\s+rd\.?$/i, "")
    .replace(/\s+marg$/i, "")
    .trim();
}

function uniqueJoin(parts: Array<string | undefined | null>, sep = ", "): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const v = (part || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.join(sep);
}

function extractBlock(text: string): string | undefined {
  const m = text.match(/\b([A-Z]\s*Block|Block\s*-?\s*[A-Z0-9]+|\d+\s*Block)\b/i);
  return m?.[1] ? cleanBlockTitle(m[1].replace(/\s+/g, " ")) : undefined;
}

function extractSector(text: string): string | undefined {
  const m = text.match(/\b(Sector\s*-?\s*\d+[A-Z]?)\b/i);
  return m?.[1] ? m[1].replace(/\s+/g, " ").replace(/Sector\s*-?\s*/i, "Sector ") : undefined;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickFromNominatim(addr: Record<string, string | undefined>, displayName: string) {
  const road = addr.road || addr.pedestrian || addr.footway || "";

  // IMPORTANT: road name wins over industrial polygon.
  // OSM often tags pin on "Sector 63 Road" but industrial area as wrong "Sector 64/65".
  const sectorFromRoad = extractSector(road);
  const sectorFromArea =
    extractSector(addr.industrial || "") ||
    extractSector(addr.commercial || "") ||
    extractSector(addr.retail || "") ||
    extractSector(addr.residential || "") ||
    extractSector(addr.suburb || "") ||
    extractSector(addr.neighbourhood || "") ||
    extractSector(addr.city_district || "") ||
    extractSector(displayName);
  const sector = sectorFromRoad || sectorFromArea;

  const block =
    extractBlock(road) ||
    extractBlock(addr.neighbourhood || "") ||
    extractBlock(addr.quarter || "") ||
    extractBlock(addr.suburb || "") ||
    extractBlock(displayName);

  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    (!isVagueLocality(addr.suburb || "") && !extractSector(addr.suburb || "")
      ? addr.suburb
      : "") ||
    addr.county ||
    addr.state_district ||
    "";

  // Flipkart-style: bold title = Block (or Sector if no block)
  let title = block || sector || "";
  if (!title && road && looksLikeBlockOrSector(road)) {
    title = cleanBlockTitle(road);
  }
  if (!title || isVagueLocality(title)) {
    const fallback =
      [addr.neighbourhood, addr.quarter, addr.suburb, road, addr.village, displayName.split(",")[0]]
        .map((x) => (x || "").trim())
        .find((x) => x && !isVagueLocality(x) && x.toLowerCase() !== (city || "").toLowerCase()) ||
      sector ||
      city ||
      displayName.split(",")[0] ||
      "Selected location";
    title = cleanBlockTitle(fallback);
  }

  // Prefer showing the actual road in subtitle (e.g. "Sector 63 Road")
  const subtitle = uniqueJoin([
    road && road !== title ? road : sector && sector !== title ? sector : undefined,
    city,
    addr.state_district && addr.state_district !== city ? addr.state_district : undefined,
    addr.state,
    addr.postcode,
  ]);

  const areaLine = uniqueJoin([
    block,
    sector,
    road && !extractSector(road) && !extractBlock(road) ? road : undefined,
  ]);

  return {
    title,
    subtitle: subtitle || displayName,
    displayName: uniqueJoin([title, subtitle]) || displayName,
    line1: areaLine || (road ? cleanBlockTitle(road) : title) || title,
    line2: uniqueJoin([block, sector]),
    city: city || "",
    state: addr.state || "",
    pincode: addr.postcode || "",
    block: block || "",
    sector: sector || "",
    road,
    sectorFromRoad: Boolean(sectorFromRoad),
  };
}

/** When pin lands on unnamed village road, find nearest Block/Sector-named OSM feature. */
async function findNearbyBlockSector(
  lat: number,
  lng: number
): Promise<{ block?: string; sector?: string; road?: string; name?: string } | null> {
  // 1) Fast path: Nominatim viewbox search for Sector / Block near the pin
  try {
    const d = 0.018;
    const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;
    for (const q of ["Sector", "Block Road", "Block"]) {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", q);
      url.searchParams.set("viewbox", viewbox);
      url.searchParams.set("bounded", "1");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "8");
      url.searchParams.set("countrycodes", "in");

      const res = await fetch(url.toString(), {
        headers: NOMINATIM_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) continue;
      const items = (await res.json()) as Array<{
        name?: string;
        display_name?: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }>;

      const scored = items
        .map((item) => {
          const name = item.name || item.display_name || "";
          const block =
            extractBlock(name) ||
            extractBlock(item.address?.road || "") ||
            extractBlock(item.address?.industrial || "");
          const sector =
            extractSector(name) ||
            extractSector(item.address?.industrial || "") ||
            extractSector(item.address?.suburb || "") ||
            extractSector(item.display_name || "");
          if (!block && !sector) return null;
          const dist = haversineM(lat, lng, Number(item.lat), Number(item.lon));
          if (dist > 1200) return null;
          return {
            name,
            block,
            sector,
            road: item.address?.road || name,
            dist,
            score: dist + (block ? 0 : 60),
          };
        })
        .filter(Boolean) as Array<{
        name: string;
        block?: string;
        sector?: string;
        road: string;
        dist: number;
        score: number;
      }>;

      if (scored.length) {
        scored.sort((a, b) => a.score - b.score);
        const best = scored[0];
        return {
          block: best.block,
          sector: best.sector,
          road: best.road,
          name: best.name,
        };
      }
    }
  } catch {
    // fall through to Overpass
  }

  const query = `
[out:json][timeout:8];
(
  way(around:600,${lat},${lng})["name"~"Sector|Block",i];
  node(around:600,${lat},${lng})["name"~"Sector|Block",i];
  relation(around:600,${lat},${lng})["name"~"Sector",i];
);
out center tags 25;
`.trim();

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "WorthKart/1.0",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = await res.json();
      const elements: Array<{
        tags?: { name?: string };
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
      }> = data.elements || [];

      if (!elements.length) continue;

      const scored = elements
        .map((el) => {
          const name = el.tags?.name || "";
          const elat = el.lat ?? el.center?.lat;
          const elng = el.lon ?? el.center?.lon;
          if (!name || elat == null || elng == null) return null;
          const dist = haversineM(lat, lng, elat, elng);
          const block = extractBlock(name);
          const sector = extractSector(name);
          const score =
            dist +
            (block ? 0 : 80) +
            (sector ? 0 : 40) +
            (/metro|aqua line|depot/i.test(name) ? 500 : 0);
          return { name, block, sector, road: name, dist, score };
        })
        .filter(Boolean) as Array<{
        name: string;
        block?: string;
        sector?: string;
        road: string;
        dist: number;
        score: number;
      }>;

      scored.sort((a, b) => a.score - b.score);
      const best = scored[0];
      if (!best || best.dist > 700) continue;

      return {
        block: best.block,
        sector: best.sector,
        road: best.road,
        name: best.name,
      };
    } catch {
      // try next mirror
    }
  }
  return null;
}

async function reverseWithGoogle(lat: number, lng: number): Promise<GeocodePayload | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "in");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;
  return parseGoogleResult(lat, lng, data.results[0]);
}

/** Mappls (MapmyIndia) — best free India-focused alternative to Google for Sector/Block. */
async function reverseWithMappls(lat: number, lng: number): Promise<GeocodePayload | null> {
  const key =
    process.env.MAPPLS_API_KEY ||
    process.env.MAPMYINDIA_API_KEY ||
    process.env.NEXT_PUBLIC_MAPPLS_API_KEY;
  if (!key) return null;

  const url = new URL("https://search.mappls.com/search/address/rev-geocode");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("region", "IND");
  url.searchParams.set("access_token", key);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = await res.json();
  const r = data?.results?.[0] as
    | {
        houseNumber?: string;
        houseName?: string;
        poi?: string;
        street?: string;
        subSubLocality?: string;
        subLocality?: string;
        locality?: string;
        village?: string;
        district?: string;
        subDistrict?: string;
        city?: string;
        state?: string;
        pincode?: string;
        formatted_address?: string;
      }
    | undefined;
  if (!r) return null;

  const street = (r.street || "").replace(/^unnamed road$/i, "").trim();
  const subLocality = r.subLocality || r.subSubLocality || "";
  const locality = r.locality || "";
  const blob = [subLocality, locality, street, r.formatted_address].filter(Boolean).join(", ");

  const block =
    extractBlock(subLocality) ||
    extractBlock(locality) ||
    extractBlock(street) ||
    extractBlock(blob);
  const sector =
    extractSector(subLocality) ||
    extractSector(locality) ||
    extractSector(street) ||
    extractSector(blob);

  // Flipkart-style: Block > subLocality > Sector > street
  const title = cleanBlockTitle(
    block ||
      (subLocality && !isVagueLocality(subLocality) ? subLocality : "") ||
      sector ||
      (locality && !isVagueLocality(locality) ? locality : "") ||
      street ||
      r.poi ||
      r.city ||
      "Selected location"
  );

  const city = r.city || r.village || "";
  const subtitle = uniqueJoin([
    street && street !== title ? street : undefined,
    sector && sector !== title ? sector : undefined,
    locality && locality !== title && locality !== sector ? locality : undefined,
    city,
    r.district && r.district !== city ? r.district : undefined,
    r.state,
    r.pincode,
  ]);

  const areaLine = uniqueJoin([block || subLocality, sector || locality, street]);

  return {
    lat,
    lng,
    title,
    subtitle: subtitle || r.formatted_address || title,
    displayName: r.formatted_address || uniqueJoin([title, subtitle]),
    line1: areaLine || title,
    line2: uniqueJoin([r.houseNumber, r.houseName]),
    city,
    state: r.state || "",
    pincode: r.pincode || "",
    source: "mappls",
  };
}

function parseGoogleResult(
  lat: number,
  lng: number,
  result: {
    formatted_address?: string;
    address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  }
): GeocodePayload {
  const comps = result.address_components || [];
  const get = (...types: string[]) =>
    comps.find((c) => types.every((t) => c.types.includes(t)))?.long_name ||
    comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name ||
    "";

  const sublocality =
    get("sublocality_level_2") ||
    get("sublocality_level_1") ||
    get("sublocality") ||
    get("neighborhood");
  const route = get("route");
  const streetNo = get("street_number");
  const locality = get("locality") || get("administrative_area_level_3") || get("postal_town");
  const district = get("administrative_area_level_2");
  const state = get("administrative_area_level_1");
  const pincode = get("postal_code");

  const block = extractBlock(sublocality) || extractBlock(route) || extractBlock(result.formatted_address || "");
  const sector =
    extractSector(sublocality) ||
    extractSector(route) ||
    extractSector(result.formatted_address || "");

  const title = cleanBlockTitle(block || sublocality || sector || route || locality || "Selected location");
  const areaLine = uniqueJoin([block || sublocality, sector, route]);
  const subtitle = uniqueJoin([
    route && route !== title ? route : undefined,
    sector && sector !== title ? sector : undefined,
    locality,
    district && district !== locality ? district : undefined,
    state,
    pincode,
  ]);

  return {
    lat,
    lng,
    title,
    subtitle,
    displayName: result.formatted_address || subtitle || title,
    line1: areaLine || title,
    line2: streetNo || "",
    city: locality || "",
    state,
    pincode,
    source: "google",
  };
}

async function reverseWithNominatim(lat: number, lng: number): Promise<
  GeocodePayload & { block?: string; sector?: string; road?: string; sectorFromRoad?: boolean }
> | null {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("zoom", "18");

  const res = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = await res.json();
  const addr = (data.address || {}) as Record<string, string | undefined>;
  const parsed = pickFromNominatim(addr, data.display_name || data.name || "");

  return {
    lat,
    lng,
    title: parsed.title,
    subtitle: parsed.subtitle,
    displayName: parsed.displayName,
    line1: parsed.line1,
    line2: parsed.line2,
    city: parsed.city,
    state: parsed.state,
    pincode: parsed.pincode,
    block: parsed.block,
    sector: parsed.sector,
    road: parsed.road,
    sectorFromRoad: parsed.sectorFromRoad,
    source: "nominatim",
  };
}

async function reverseWithBigDataCloud(lat: number, lng: number): Promise<Partial<GeocodePayload> | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "en");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const adminNames: string[] = (data.localityInfo?.administrative || [])
      .map((x: { name?: string }) => x.name || "")
      .filter(Boolean);
    const sector = adminNames.map(extractSector).find(Boolean);
    const block = adminNames.map(extractBlock).find(Boolean);
    return {
      title: block || sector || data.locality || undefined,
      city: data.city || "",
      state: data.principalSubdivision || "",
      pincode: data.postcode || "",
      displayName: adminNames.slice(0, 5).join(", "),
    };
  } catch {
    return null;
  }
}

function finalizePayload(
  base: GeocodePayload & {
    block?: string;
    sector?: string;
    road?: string;
    sectorFromRoad?: boolean;
  },
  extras?: { block?: string; sector?: string; road?: string }
): GeocodePayload {
  let { title, subtitle, line1, city, state, pincode, displayName, lat, lng, source } = base;
  let block = base.block || "";
  let sector = base.sector || "";
  const pinRoad = base.road || "";
  const lockSector = Boolean(base.sectorFromRoad && sector);

  if (extras) {
    if (extras.block && !block) block = extras.block;
    // Never overwrite sector taken from the pin's own road (e.g. Sector 63 Road)
    if (extras.sector && !sector && !lockSector) sector = extras.sector;
    if (extras.road && (!line1 || isVagueLocality(line1))) {
      line1 = uniqueJoin([extras.block, extras.sector, extras.road]);
    }
  }

  const roadForSubtitle =
    (pinRoad ? pinRoad : undefined) ||
    (extras?.road && (extractSector(extras.road) || extractBlock(extras.road))
      ? extras.road
      : undefined);

  if (block || sector) {
    title = block || sector;
    line1 = uniqueJoin([block, sector]) || line1;
    subtitle = uniqueJoin([
      roadForSubtitle && roadForSubtitle !== title ? roadForSubtitle : undefined,
      sector && sector !== title && sector !== roadForSubtitle ? sector : undefined,
      city,
      state,
      pincode,
    ]);
    displayName = uniqueJoin([title, subtitle]);
    if (extras && (extras.block || (!lockSector && extras.sector))) {
      source = `${source}+nearby`;
    }
  } else if (isVagueLocality(title) && city) {
    title = city;
    subtitle = uniqueJoin([
      base.line1 && !isVagueLocality(base.line1) && base.line1 !== city ? base.line1 : undefined,
      state,
      pincode,
    ]);
    displayName = uniqueJoin([title, subtitle]);
  }

  return {
    lat,
    lng,
    title,
    subtitle,
    displayName,
    line1: line1 || title,
    line2: uniqueJoin([block, sector]),
    city,
    state,
    pincode,
    source,
  };
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    // Prefer paid/accurate India providers when keys exist
    const google = await reverseWithGoogle(lat, lng);
    if (google) {
      return NextResponse.json(google);
    }

    const mappls = await reverseWithMappls(lat, lng);
    if (mappls) {
      return NextResponse.json(mappls);
    }

    const [nominatim, bdc] = await Promise.all([
      reverseWithNominatim(lat, lng),
      reverseWithBigDataCloud(lat, lng),
    ]);

    if (!nominatim && !bdc) {
      return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
    }

    let base: GeocodePayload & {
      block?: string;
      sector?: string;
      road?: string;
      sectorFromRoad?: boolean;
    } = nominatim || {
      lat,
      lng,
      title: bdc?.title || "Selected location",
      subtitle: bdc?.displayName || "",
      displayName: bdc?.displayName || "",
      line1: bdc?.title || "",
      line2: "",
      city: bdc?.city || "",
      state: bdc?.state || "",
      pincode: bdc?.pincode || "",
      source: "bigdatacloud",
    };

    if (bdc) {
      if ((!base.city || isVagueLocality(base.city)) && bdc.city) base.city = bdc.city;
      if (!base.pincode && bdc.pincode) base.pincode = bdc.pincode;
      if (!base.state && bdc.state) base.state = bdc.state;
      // Don't let BigDataCloud overwrite a sector taken from the pin road
      if (bdc.title && extractSector(bdc.title) && !base.sector && !base.sectorFromRoad) {
        base.sector = extractSector(bdc.title);
      }
      if (bdc.title && extractBlock(bdc.title) && !base.block) {
        base.block = extractBlock(bdc.title);
      }
    }

    // Only hunt nearby when we still lack block, or lack any sector at all.
    // If sector came from "Sector 63 Road", do not replace it with Sector 65 polygons.
    const shouldEnrich =
      !base.block || (!base.sector && !base.sectorFromRoad) || isVagueLocality(base.title);

    let nearby: { block?: string; sector?: string; road?: string; name?: string } | null = null;
    if (shouldEnrich) {
      nearby = await findNearbyBlockSector(lat, lng);
      // If pin road already gave Sector 63, keep it — nearby may return wrong Sector 65
      if (nearby && base.sectorFromRoad && base.sector) {
        nearby = { ...nearby, sector: base.sector };
      }
    }

    const payload = finalizePayload(base, nearby || undefined);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Geocode unavailable" }, { status: 500 });
  }
}
