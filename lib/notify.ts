"use client";

import toast from "react-hot-toast";

export const notify = {
  success(message: string) {
    return toast.success(message);
  },
  error(message: string) {
    return toast.error(message);
  },
  info(message: string) {
    return toast(message, { icon: "ℹ️" });
  },
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string) {
    toast.dismiss(id);
  },
};
