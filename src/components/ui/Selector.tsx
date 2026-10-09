import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

type SelectorProps = {
  value: string;
  onChange: (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  options: string[];
  placeholder?: string;
};

export const Selector = ({ value, onChange, options, placeholder }: SelectorProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const items = options.filter(Boolean);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (next: string) => {
    onChange({
      target: { value: next },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 cursor-pointer items-center rounded-md border border-border bg-card py-2 pr-10 pl-3 text-left font-sans text-sm text-ink outline-none focus-visible:border-primary"
      >
        <span className="min-w-0 flex-1 truncate">{value || placeholder || "Vælg…"}</span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute top-[calc(100%+0.35rem)] left-1/2 z-30 w-max min-w-full max-w-[min(100vw-2rem,22rem)] origin-top -translate-x-1/2 transition-[opacity,transform] duration-200 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {/* Outer clips scrollbar to rounded corners; inner scrolls */}
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-[0_12px_28px_rgba(18,57,74,0.14)]">
          <ul
            id={listId}
            role="listbox"
            aria-hidden={!open}
            className="max-h-60 overflow-y-auto py-1"
          >
            {items.map((option) => {
              const selected = option === value;
              return (
                <li key={option} role="presentation">
                  <button
                    type="button"
                    role="option"
                    title={option}
                    aria-selected={selected}
                    tabIndex={open ? 0 : -1}
                    onClick={() => select(option)}
                    className={`flex w-full cursor-pointer border-0 px-3 py-2 text-left font-sans text-sm transition-colors ${
                      selected
                        ? "bg-primary-100 font-semibold text-primary"
                        : "bg-transparent text-ink hover:bg-paper-200"
                    }`}
                  >
                    <span className="truncate">{option}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
