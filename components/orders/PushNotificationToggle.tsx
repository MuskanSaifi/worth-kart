"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushNotificationToggle({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok && Notification.permission === "granted") {
      navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
        reg?.pushManager.getSubscription().then((sub) => setEnabled(!!sub));
      });
    }
  }, []);

  if (!supported) return null;

  async function enable() {
    setBusy(true);
    setHint("");
    try {
      const cfg = await fetch("/api/push/subscribe").then((r) => r.json());
      if (!cfg.publicKey) {
        setHint("Push is not configured on the server yet.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setHint("Notification permission denied.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      setEnabled(true);
      setHint("Order alerts enabled on this device.");
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not enable push");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setHint("Push alerts turned off.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => (enabled ? disable() : enable())}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#007185] hover:underline disabled:opacity-50"
      >
        {enabled ? <BellOff size={16} /> : <Bell size={16} />}
        {enabled ? "Disable order alerts" : "Enable push alerts"}
      </button>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}
