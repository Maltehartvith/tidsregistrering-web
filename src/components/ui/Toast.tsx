import { Check, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

const DEFAULT_DURATION_MS = 2200;
const DEFAULT_TYPE: ToastType = "info";
const ANIM_MS = 300;

type ToastContextValue = {
  showToast: (msg: string, durationMs?: number, type?: ToastType) => void;
  clearToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({
  message,
  type,
}: {
  message: string;
  type: ToastType;
}) {
  const [display, setDisplay] = useState("");
  const [open, setOpen] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    if (message) {
      setDisplay(message);
      // Paint in the hidden (behind-nav) state first, then open so the
      // transform transition actually runs instead of appearing in place.
      setOpen(false);
      enterTimerRef.current = setTimeout(() => {
        setOpen(true);
        enterTimerRef.current = null;
      }, 20);
      return () => {
        if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      };
    }

    setOpen(false);
    exitTimerRef.current = setTimeout(() => {
      setDisplay("");
      exitTimerRef.current = null;
    }, ANIM_MS);

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [message]);

  if (!display) return null;

  const Icon = type === "success" ? Check : type === "error" ? X : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-19 left-1/2 z-5 flex items-center gap-1.5 rounded-full px-4.5 py-2.5 text-[0.8125rem] leading-none text-card shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
        open
          ? "-translate-x-1/2 translate-y-0"
          : "-translate-x-1/2 translate-y-18"
      } ${type === "success" ? "bg-emerald-600" : type === "error" ? "bg-red-700" : "bg-sky-700"}`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
      <span>{display}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>(DEFAULT_TYPE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage("");
  }, []);

  const showToast = useCallback(
    (
      msg: string,
      durationMs = DEFAULT_DURATION_MS,
      nextType = DEFAULT_TYPE,
    ) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setType(nextType);
      setMessage(msg);
      timerRef.current = setTimeout(() => setMessage(""), durationMs);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, clearToast }}>
      {children}
      <ToastViewport message={message} type={type} />
    </ToastContext.Provider>
  );
}

/** Call from any screen under ToastProvider. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
