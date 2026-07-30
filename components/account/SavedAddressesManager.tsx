"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import type { ReverseGeocodeResult } from "@/lib/geocode";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { notify } from "@/lib/notify";

const MapLocationPicker = dynamic(
  () =>
    import("@/components/address/MapLocationPicker").then((m) => m.MapLocationPicker),
  { ssr: false }
);

export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type FormState = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyForm = (defaults?: { name?: string; phone?: string }): FormState => ({
  name: defaults?.name || "",
  phone: defaults?.phone || "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
});

export function SavedAddressesManager({
  initialAddresses,
  defaultName,
  defaultPhone,
}: {
  initialAddresses: SavedAddress[];
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showMap, setShowMap] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(
    emptyForm({ name: defaultName || "", phone: defaultPhone || "" })
  );
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const labeled = useMemo(
    () =>
      addresses.map((addr, index) => ({
        ...addr,
        label: addr.isDefault ? "Default address" : `Address ${index + 1}`,
      })),
    [addresses]
  );

  const onMapConfirm = (result: ReverseGeocodeResult) => {
    const area =
      result.line1 ||
      result.line2 ||
      [result.title, result.subtitle].filter(Boolean).join(", ") ||
      result.displayName ||
      "";
    setForm((prev) => ({
      ...prev,
      name: prev.name || defaultName || "",
      phone: prev.phone || defaultPhone || "",
      line1: "",
      line2: area,
      city: result.city || prev.city,
      state: result.state || prev.state,
      pincode: result.pincode || prev.pincode,
    }));
    setShowForm(true);
    setError("");
  };

  const saveAddress = async () => {
    if (
      !form.name ||
      !form.phone ||
      !form.line1 ||
      !form.line2 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      setError("Please fill name, phone, house/flat and area / sector");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        isDefault: addresses.length === 0,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save address");
      return;
    }
    setAddresses((prev) =>
      data.address.isDefault
        ? [...prev.map((a) => ({ ...a, isDefault: false })), data.address]
        : [...prev, data.address]
    );
    setShowForm(false);
    setForm(emptyForm({ name: defaultName || "", phone: defaultPhone || "" }));
    router.refresh();
  };

  const setDefault = async (id: string) => {
    setBusyId(id);
    const res = await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    setBusyId("");
    if (!res.ok) return;
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    router.refresh();
  };

  const removeAddress = async (id: string) => {
    const ok = await confirm("Delete this address?", {
      title: "Delete address",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(id);
    const res = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setBusyId("");
    if (!res.ok) {
      notify.error("Could not delete address");
      return;
    }
    notify.success("Address deleted");
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length && !next.some((a) => a.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
    router.refresh();
  };

  return (
    <div id="addresses" className="bg-card rounded-lg border border-border p-5 scroll-mt-24">
      <MapLocationPicker
        open={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={onMapConfirm}
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold">Saved Addresses</h2>
          <p className="text-xs text-muted mt-0.5">
            Pin location on map and save Address 1, Address 2… for checkout
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowMap(true);
            setError("");
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0"
        >
          <Plus size={16} /> Add via map
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 mb-4 space-y-3 bg-gray-50/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary flex items-center gap-1">
              <MapPin size={12} /> Location from map
            </p>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Change on map
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-border rounded text-sm bg-white"
            />
            <input
              placeholder="10-digit mobile *"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              className="px-3 py-2 border border-border rounded text-sm bg-white"
            />
          </div>
          <input
            placeholder="House / Flat / Floor / Landmark *"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
          />
          <input
            placeholder="Area / Sector / Locality *"
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="City *"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 border border-border rounded text-sm bg-white"
            />
            <input
              placeholder="State *"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="px-3 py-2 border border-border rounded text-sm bg-white"
            />
            <input
              placeholder="Pincode *"
              value={form.pincode}
              onChange={(e) =>
                setForm({
                  ...form,
                  pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              className="px-3 py-2 border border-border rounded text-sm bg-white"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveAddress}
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save address
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="px-4 py-2 border border-border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {labeled.length > 0 ? (
        <div className="space-y-3">
          {labeled.map((addr, index) => (
            <div
              key={addr.id}
              className="text-sm p-3 bg-gray-50 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-purple-50 border border-primary/20 px-2 py-0.5 rounded">
                      <Home size={12} />
                      Address {index + 1}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Star size={11} /> Default
                      </span>
                    )}
                  </div>
                  <p className="font-medium">
                    {addr.name} · {addr.phone}
                  </p>
                  <p className="text-muted mt-0.5">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} -{" "}
                    {addr.pincode}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      disabled={busyId === addr.id}
                      onClick={() => setDefault(addr.id)}
                      className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === addr.id}
                    onClick={() => removeAddress(addr.id)}
                    className="text-xs text-danger font-semibold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <MapPin size={28} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted mb-3">No saved addresses yet</p>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Add address using map
            </button>
          </div>
        )
      )}
    </div>
  );
}
