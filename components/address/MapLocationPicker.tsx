"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getBrowserLocation,
  reverseGeocode,
  searchPlaces,
  type PlaceSearchResult,
  type ReverseGeocodeResult,
} from "@/lib/geocode";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

type MapLocationPickerProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: ReverseGeocodeResult) => void;
};

export function MapLocationPicker({ open, onClose, onConfirm }: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ReverseGeocodeResult | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const updateAddress = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    setError("");
    const result = await reverseGeocode(lat, lng);
    setResolving(false);
    if (!result) {
      setError("Could not fetch address for this pin. Try another spot.");
      return;
    }
    setPreview(result);
  }, []);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", () => {
      const c = map.getCenter();
      const next = { lat: c.lat, lng: c.lng };
      setCenter(next);
      void updateAddress(next.lat, next.lng);
    });

    mapRef.current = map;
    setReady(true);
    void updateAddress(center.lat, center.lng);
    const t = setTimeout(() => map.invalidateSize(), 120);

    return () => {
      clearTimeout(t);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      map.remove();
      mapRef.current = null;
      setReady(false);
      setPreview(null);
      setError("");
      setQuery("");
      setSuggestions([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSearchChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchPlaces(value.trim());
      setSuggestions(results);
      setSearching(false);
    }, 350);
  };

  const pickSuggestion = (place: PlaceSearchResult) => {
    setQuery(place.title);
    setSuggestions([]);
    setCenter({ lat: place.lat, lng: place.lng });
    mapRef.current?.setView([place.lat, place.lng], 17, { animate: true });
    void updateAddress(place.lat, place.lng);
  };

  const goToCurrentLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const loc = await getBrowserLocation();
      setCenter(loc);
      mapRef.current?.setView([loc.lat, loc.lng], 17, { animate: true });
      await updateAddress(loc.lat, loc.lng);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location permission denied");
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm(preview);
    onClose();
  };

  if (!open) return null;

  const title = preview?.title || "";
  const subtitle =
    preview?.subtitle ||
    (preview
      ? [preview.line1, preview.city, preview.state, preview.pincode].filter(Boolean).join(", ")
      : "");

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-semibold text-base">Add new address</h2>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="relative flex-1 min-h-[55vh] lg:min-h-0">
          <div ref={mapContainerRef} className="absolute inset-0 bg-gray-100" />

          <div className="absolute top-3 left-3 right-3 z-[500] max-w-xl mx-auto lg:mx-0 lg:max-w-md">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by area, name, street"
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border bg-white shadow-md text-sm outline-none focus:border-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {(suggestions.length > 0 || searching) && (
              <ul className="mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                {searching && suggestions.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Searching...
                  </li>
                )}
                {suggestions.map((s) => (
                  <li key={`${s.lat}-${s.lng}-${s.title}`}>
                    <button
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-border last:border-0"
                    >
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted line-clamp-1">{s.subtitle}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[400]">
            <div className="relative flex flex-col items-center -mt-8">
              <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded shadow mb-1 whitespace-nowrap">
                Place pin on the exact location
              </div>
              <MapPin size={40} className="text-primary fill-primary drop-shadow-lg" />
            </div>
          </div>

          <button
            type="button"
            onClick={goToCurrentLocation}
            disabled={locating || !ready}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-white border-2 border-primary text-primary px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 hover:bg-purple-50 disabled:opacity-60"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            Use my current location
          </button>
        </div>

        <aside className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-border bg-white p-5 flex flex-col gap-4 shrink-0">
          <div>
            <h3 className="font-bold text-lg leading-snug">Deliver To</h3>
            <p className="text-sm text-muted mt-1">
              Drag the map to place the pin on the exact delivery spot
            </p>
          </div>

          <div className="border border-border rounded-lg p-3 min-h-[96px] bg-white">
            {resolving ? (
              <p className="text-sm text-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Fetching address...
              </p>
            ) : preview ? (
              <div className="flex gap-2">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-base text-foreground leading-snug">{title}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(
                          'input[placeholder="Search by area, name, street"]'
                        );
                        input?.focus();
                        input?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                      className="shrink-0 text-xs font-semibold text-primary border border-primary px-2 py-0.5 rounded hover:bg-purple-50"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm text-muted mt-1 leading-snug line-clamp-3">{subtitle}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Move the map to pick a location</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview || resolving}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            Add address Details
          </button>

          <button
            type="button"
            onClick={goToCurrentLocation}
            disabled={locating}
            className="w-full border-2 border-primary text-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-purple-50 disabled:opacity-50"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            Use current location
          </button>

          <p className="text-[11px] text-muted text-center mt-auto">
            You can edit house no. / landmark on the next step
          </p>
        </aside>
      </div>
    </div>
  );
}
