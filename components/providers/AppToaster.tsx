"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerClassName="!top-4"
      toastOptions={{
        duration: 4000,
        className: "!text-sm !font-medium",
        style: {
          background: "#ffffff",
          color: "#212121",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 10px 28px rgba(91, 33, 182, 0.12)",
          padding: "14px 18px",
          maxWidth: "min(420px, calc(100vw - 32px))",
        },
        success: {
          duration: 3500,
          iconTheme: { primary: "#16a34a", secondary: "#ffffff" },
        },
        error: {
          duration: 4500,
          iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
        },
      }}
    />
  );
}
