"use client";

import { useEffect } from "react";
import { Toast } from "@/hooks/useAlerts";

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 8000;

export default function AlertToast({ toasts, onDismiss }: Props) {
  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), AUTO_DISMISS_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-gray-950 shadow-lg"
        >
          <span>🔔 {toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-800 hover:text-gray-950"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
