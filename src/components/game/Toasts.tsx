import { useEffect, useState } from "react";
import { dismissToast, subscribeToasts, type Toast } from "@/game/alerts";

export function ToastStack() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setItems), []);
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3" aria-live="polite">
      <div className="safe-top grid w-full max-w-sm gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismissToast(item.id)}
            className={`toast pointer-events-auto rounded-2xl border border-line bg-surface px-3 py-3 text-left shadow-none ${item.leaving ? "toast-out" : ""} ${item.tone === "goal" ? "toast-goal" : ""}`}
          >
            <div className={`text-xs font-medium tracking-widest uppercase ${item.tone === "goal" ? "text-primary" : "text-muted"}`}>
              {item.title}
            </div>
            <div className="mt-1 text-sm text-pretty">{item.body}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
