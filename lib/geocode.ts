export type ReverseGeocodeResult = {
  lat: number;
  lng: number;
  /** Short place name e.g. "G Block" (Flipkart-style title) */
  title: string;
  /** Rest of address under the title */
  subtitle: string;
  displayName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  source?: string;
};

export type PlaceSearchResult = {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
};

/** Reverse geocode lat/lng via our API (Google → Mappls → Nominatim). */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ReverseGeocodeResult;
    if (!data.title && data.displayName) {
      data.title = data.displayName.split(",")[0]?.trim() || "Selected location";
    }
    if (!data.subtitle) {
      data.subtitle = data.displayName || "";
    }
    return data;
  } catch {
    return null;
  }
}

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as PlaceSearchResult[];
  } catch {
    return [];
  }
}

export function getBrowserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(new Error(err.message || "Could not get location")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
