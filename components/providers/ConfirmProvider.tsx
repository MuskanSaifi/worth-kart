"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Please confirm");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [cancelLabel, setCancelLabel] = useState("Cancel");
  const [destructive, setDestructive] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const confirm = useCallback((msg: string, options?: ConfirmOptions) => {
    setMessage(msg);
    setTitle(options?.title ?? "Please confirm");
    setConfirmLabel(options?.confirmLabel ?? "Confirm");
    setCancelLabel(options?.cancelLabel ?? "Cancel");
    setDestructive(options?.destructive ?? false);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-gray-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white ${
                  destructive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:opacity-90"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
