import { NextRequest, NextResponse } from "next/server";

/** Place search for map picker (Nominatim, India-focused). */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const googleKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapplsKey =
      process.env.MAPPLS_API_KEY ||
      process.env.MAPMYINDIA_API_KEY ||
      process.env.NEXT_PUBLIC_MAPPLS_API_KEY;

    if (googleKey) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.set("input", q);
      url.searchParams.set("components", "country:in");
      url.searchParams.set("language", "en");
      url.searchParams.set("key", googleKey);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (data.status === "OK" && data.predictions?.length) {
        const results = await Promise.all(
          data.predictions.slice(0, 6).map(async (p: { description: string; place_id: string }) => {
            const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
            detailsUrl.searchParams.set("place_id", p.place_id);
            detailsUrl.searchParams.set("fields", "geometry,formatted_address,name");
            detailsUrl.searchParams.set("key", googleKey);
            const dRes = await fetch(detailsUrl.toString(), { cache: "no-store" });
            const d = await dRes.json();
            const loc = d.result?.geometry?.location;
            if (!loc) return null;
            return {
              title: d.result?.name || p.description.split(",")[0],
              subtitle: d.result?.formatted_address || p.description,
              lat: loc.lat,
              lng: loc.lng,
            };
          })
        );
        return NextResponse.json({ results: results.filter(Boolean) });
      }
    }

    if (mapplsKey) {
      const url = new URL("https://search.mappls.com/search/places/v1/autosuggest");
      url.searchParams.set("query", q);
      url.searchParams.set("region", "IND");
      url.searchParams.set("access_token", mapplsKey);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const suggested = (data.suggestedLocations || data.results || []) as Array<{
          placeName?: string;
          placeAddress?: string;
          eLoc?: string;
          latitude?: number;
          longitude?: number;
          lat?: number;
          lng?: number;
        }>;
        const results = suggested
          .slice(0, 6)
          .map((item) => {
            const lat = Number(item.latitude ?? item.lat);
            const lng = Number(item.longitude ?? item.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              title: item.placeName || "Place",
              subtitle: item.placeAddress || "",
              lat,
              lng,
            };
          })
          .filter(Boolean);
        if (results.length) {
          return NextResponse.json({ results });
        }
      }
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("limit", "6");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "WorthKart/1.0 (checkout-address; support@worthkart.in)",
        "Accept-Language": "en-IN,en",
      },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    const results = (data || []).map(
      (item: {
        display_name: string;
        name?: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }) => ({
        title:
          item.name ||
          item.address?.neighbourhood ||
          item.address?.suburb ||
          item.address?.road ||
          item.display_name.split(",")[0],
        subtitle: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
