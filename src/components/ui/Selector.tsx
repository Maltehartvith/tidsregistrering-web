import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type MenuPosition = "left" | "center" | "right";

export type SelectorOption = {
  value: string;
  label: string;
};

type SelectorProps = {
  value: string;
  onChange: (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  options: Array<string | SelectorOption>;
  placeholder?: string;
  position?: MenuPosition;
};

type MenuCoords = {
  top: number;
  left: number;
  minWidth: number;
  transformOrigin: string;
};

function normalizeOptions(
  options: Array<string | SelectorOption>,
): SelectorOption[] {
  return options
    .map((option) =>
      typeof option === "string"
        ? option
          ? { value: option, label: option }
          : null
        : option.value
          ? option
          : null,
    )
    .filter((option): option is SelectorOption => option != null);
}

function menuCoordsFor(
  trigger: HTMLElement,
  position: MenuPosition,
  menuWidth?: number,
): MenuCoords {
  const rect = trigger.getBoundingClientRect();
  const minWidth = Math.min(rect.width, window.innerWidth - 16);
  const width = Math.min(
    Math.max(menuWidth ?? minWidth, minWidth),
    window.innerWidth - 16,
  );
  let left = rect.left;
  if (position === "center") {
    left = rect.left + (rect.width - width) / 2;
  } else if (position === "right") {
    left = rect.right - width;
  }
  left = Math.min(Math.max(8, left), window.innerWidth - width - 8);

  return {
    top: rect.bottom + 6,
    left,
    minWidth,
    transformOrigin:
      position === "left"
        ? "top left"
        : position === "right"
          ? "top right"
          : "top center",
  };
}

export const Selector = ({
  value,
  onChange,
  options,
  placeholder,
  position = "center",
}: SelectorProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const items = normalizeOptions(options);
  const selectedLabel =
    items.find((option) => option.value === value)?.label ?? value;

  const reposition = () => {
    const trigger = rootRef.current;
    if (!trigger) return;
    const measured = menuRef.current?.getBoundingClientRect().width;
    setCoords(menuCoordsFor(trigger, position, measured));
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    reposition();
  }, [open, position, items.length]);

  useLayoutEffect(() => {
    if (!open || !coords || !menuRef.current || !rootRef.current) return;
    const measured = menuRef.current.getBoundingClientRect().width;
    const next = menuCoordsFor(rootRef.current, position, measured);
    if (next.left !== coords.left || next.minWidth !== coords.minWidth) {
      setCoords(next);
    }
  }, [open, position, coords, items.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, position]);

  const select = (next: string) => {
    onChange({
      target: { value: next },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const menuStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        minWidth: coords.minWidth,
        transformOrigin: coords.transformOrigin,
      }
    : undefined;

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
        <span className="min-w-0 flex-1 truncate">
          {selectedLabel || placeholder || "Vælg…"}
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className={`fixed z-50 w-max max-w-100 transition-[opacity,transform] duration-200 ease-out ${
              coords
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-md border border-border bg-card py-1 shadow-[0_12px_28px_rgba(18,57,74,0.14)]">
              <ul
                id={listId}
                role="listbox"
                className="max-h-60 ml-2 overflow-y-auto"
              >
                {items.map((option) => {
                  const selected = option.value === value;
                  return (
                    <li key={option.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        title={option.label}
                        aria-selected={selected}
                        onClick={() => select(option.value)}
                        className={`max-w-full rounded-sm w-full cursor-pointer truncate border-0 px-3 py-2 text-left font-sans text-sm transition-colors ${
                          selected
                            ? "bg-primary-100 font-semibold text-primary"
                            : "bg-transparent text-ink hover:bg-paper-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
