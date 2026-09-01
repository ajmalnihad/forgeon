import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn.js";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = "success") => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-3"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              "anim-toast pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-left text-sm shadow-card backdrop-blur",
              "bg-elevated/95 text-fg",
              t.type === "success" && "border-success/40",
              t.type === "error" && "border-danger/50",
              t.type === "info" && "border-line"
            )}
          >
            <span
              className={cn(
                "mr-2 inline-block size-2 rounded-full align-middle",
                t.type === "success" && "bg-success",
                t.type === "error" && "bg-danger",
                t.type === "info" && "bg-accent"
              )}
            />
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
