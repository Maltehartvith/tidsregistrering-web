const HIDE_AFTER_MS = 400;
const hideTimers = new WeakMap<HTMLElement, number>();

function overflowAxes(el: HTMLElement) {
  const style = getComputedStyle(el);
  return {
    y: style.overflowY === "auto" || style.overflowY === "scroll",
    x: style.overflowX === "auto" || style.overflowX === "scroll",
  };
}

function canScroll(el: HTMLElement) {
  const { x, y } = overflowAxes(el);
  return (
    (y && el.scrollHeight > el.clientHeight + 1) ||
    (x && el.scrollWidth > el.clientWidth + 1)
  );
}

function canScrollInDirection(el: HTMLElement, deltaX: number, deltaY: number) {
  const { x, y } = overflowAxes(el);
  if (y && deltaY !== 0) {
    if (deltaY < 0 && el.scrollTop > 0) return true;
    if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)
      return true;
  }
  if (x && deltaX !== 0) {
    if (deltaX < 0 && el.scrollLeft > 0) return true;
    if (deltaX > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
      return true;
  }
  return false;
}

function nearestScrollable(target: EventTarget | null) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && canScroll(node)) return node;
    node = node.parentElement;
  }
  return null;
}

function nearestScrollableForWheel(
  target: EventTarget | null,
  deltaX: number,
  deltaY: number,
) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.documentElement) {
    if (
      node instanceof HTMLElement &&
      canScroll(node) &&
      canScrollInDirection(node, deltaX, deltaY)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function wheelDeltaPixels(event: WheelEvent) {
  let { deltaX, deltaY } = event;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    deltaX *= 16;
    deltaY *= 16;
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    deltaX *= window.innerWidth;
    deltaY *= window.innerHeight;
  }
  return { deltaX, deltaY };
}

function showScrollbar(el: HTMLElement) {
  const pending = hideTimers.get(el);
  if (pending) window.clearTimeout(pending);
  hideTimers.delete(el);
  el.classList.add("scrollbar-visible");
}

function hideScrollbarLater(el: HTMLElement) {
  const pending = hideTimers.get(el);
  if (pending) window.clearTimeout(pending);
  hideTimers.set(
    el,
    window.setTimeout(() => {
      el.classList.remove("scrollbar-visible");
      hideTimers.delete(el);
    }, HIDE_AFTER_MS),
  );
}

document.addEventListener(
  "pointerover",
  (event) => {
    const el = nearestScrollable(event.target);
    if (el) showScrollbar(el);
  },
  true,
);

document.addEventListener(
  "pointerout",
  (event) => {
    const el = nearestScrollable(event.target);
    if (!el) return;
    const next = event.relatedTarget;
    if (next instanceof Node && el.contains(next)) return;
    hideScrollbarLater(el);
  },
  true,
);

document.addEventListener(
  "scroll",
  (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement) || !canScroll(el)) return;
    // scroll events arrive on a later frame than the scrollTop write, so a
    // synchronous "we are scrolling" flag always misses them and cancels the glide.
    const applied = appliedScroll.get(el);
    const fromUs =
      applied !== undefined &&
      Math.abs(el.scrollLeft - applied.left) <= 1 &&
      Math.abs(el.scrollTop - applied.top) <= 1;
    if (!fromUs) stopSmooth(el);
    showScrollbar(el);
    if (!el.matches(":hover")) hideScrollbarLater(el);
  },
  { capture: true, passive: true },
);

/*
  Chrome latches wheel to the first scroller for the whole gesture. Drive the
  pane under the cursor ourselves so hover never has to toggle overflow
  (which was shifting content width between the list and detail panes).

  preventDefault() also skips Chrome's wheel animation, so a mouse notch
  (often 100px) would land in one tick. Ease those discrete steps. Trackpad
  deltas are already a stream of small values, so apply them directly.
*/
const MOUSE_NOTCH_PX = 40;
const SMOOTH_TAU_MS = 42;

let wheelTarget: HTMLElement | null = null;
let wheelDx = 0;
let wheelDy = 0;
let wheelRaf = 0;

const appliedScroll = new WeakMap<HTMLElement, { left: number; top: number }>();

type SmoothScroll = {
  targetLeft: number;
  targetTop: number;
  raf: number;
  lastTime: number;
};

const smoothScrolls = new WeakMap<HTMLElement, SmoothScroll>();

function isDiscreteWheel(event: WheelEvent, deltaX: number, deltaY: number) {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return true;
  const dominant = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  if (dominant < MOUSE_NOTCH_PX) return false;
  return Number.isInteger(event.deltaX) && Number.isInteger(event.deltaY);
}

function clampScroll(el: HTMLElement, left: number, top: number) {
  const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
  return {
    left: Math.min(maxLeft, Math.max(0, left)),
    top: Math.min(maxTop, Math.max(0, top)),
  };
}

function applyScroll(el: HTMLElement, left: number, top: number) {
  if (left === el.scrollLeft && top === el.scrollTop) return;
  appliedScroll.set(el, { left, top });
  if (left !== el.scrollLeft) el.scrollLeft = left;
  if (top !== el.scrollTop) el.scrollTop = top;
}

function stopSmooth(el: HTMLElement) {
  const state = smoothScrolls.get(el);
  if (!state) return;
  if (state.raf) cancelAnimationFrame(state.raf);
  smoothScrolls.delete(el);
}

function tickSmooth(el: HTMLElement, now: number) {
  const state = smoothScrolls.get(el);
  if (!state) return;
  state.raf = 0;

  const beforeLeft = el.scrollLeft;
  const beforeTop = el.scrollTop;
  const remainX = state.targetLeft - beforeLeft;
  const remainY = state.targetTop - beforeTop;
  if (Math.abs(remainX) < 1 && Math.abs(remainY) < 1) {
    applyScroll(el, state.targetLeft, state.targetTop);
    smoothScrolls.delete(el);
    return;
  }

  const dt = state.lastTime ? Math.min(32, now - state.lastTime) : 16;
  state.lastTime = now;
  const blend = 1 - Math.exp(-dt / SMOOTH_TAU_MS);
  let left = beforeLeft + remainX * blend;
  let top = beforeTop + remainY * blend;
  if (Math.abs(state.targetLeft - left) < 1) left = state.targetLeft;
  if (Math.abs(state.targetTop - top) < 1) top = state.targetTop;

  applyScroll(el, left, top);

  const stuck =
    Math.abs(el.scrollLeft - beforeLeft) < 0.5 &&
    Math.abs(el.scrollTop - beforeTop) < 0.5;
  const done =
    stuck ||
    (Math.abs(el.scrollLeft - state.targetLeft) < 1 &&
      Math.abs(el.scrollTop - state.targetTop) < 1);
  if (done) {
    applyScroll(el, state.targetLeft, state.targetTop);
    smoothScrolls.delete(el);
    return;
  }
  state.raf = requestAnimationFrame((time) => tickSmooth(el, time));
}

function smoothScrollBy(el: HTMLElement, dx: number, dy: number) {
  let state = smoothScrolls.get(el);
  if (!state) {
    state = {
      targetLeft: el.scrollLeft,
      targetTop: el.scrollTop,
      raf: 0,
      lastTime: 0,
    };
    smoothScrolls.set(el, state);
  }
  const pendingX = state.targetLeft - el.scrollLeft;
  const pendingY = state.targetTop - el.scrollTop;
  const reversed =
    (dx !== 0 && pendingX !== 0 && Math.sign(dx) !== Math.sign(pendingX)) ||
    (dy !== 0 && pendingY !== 0 && Math.sign(dy) !== Math.sign(pendingY));
  if (reversed) {
    state.targetLeft = el.scrollLeft;
    state.targetTop = el.scrollTop;
    state.lastTime = 0;
  }

  const next = clampScroll(el, state.targetLeft + dx, state.targetTop + dy);
  state.targetLeft = next.left;
  state.targetTop = next.top;
  if (!state.raf) {
    state.raf = requestAnimationFrame((time) => tickSmooth(el, time));
  }
}

function flushWheel() {
  wheelRaf = 0;
  const el = wheelTarget;
  if (!el) return;
  const dx = wheelDx;
  const dy = wheelDy;
  wheelDx = 0;
  wheelDy = 0;
  const next = clampScroll(el, el.scrollLeft + dx, el.scrollTop + dy);
  applyScroll(el, next.left, next.top);
}

document.addEventListener(
  "wheel",
  (event) => {
    if (event.defaultPrevented || event.ctrlKey) return;

    const { deltaX, deltaY } = wheelDeltaPixels(event);
    if (deltaX === 0 && deltaY === 0) return;

    const under =
      document.elementFromPoint(event.clientX, event.clientY) ?? event.target;
    const el = nearestScrollableForWheel(under, deltaX, deltaY);
    if (!el) return;

    event.preventDefault();

    if (wheelTarget !== el) {
      if (wheelRaf) {
        cancelAnimationFrame(wheelRaf);
        flushWheel();
      }
      wheelTarget = el;
    }

    if (isDiscreteWheel(event, deltaX, deltaY)) {
      if (wheelRaf) {
        cancelAnimationFrame(wheelRaf);
        flushWheel();
      }
      smoothScrollBy(el, deltaX, deltaY);
    } else {
      stopSmooth(el);
      wheelDx += deltaX;
      wheelDy += deltaY;
      if (!wheelRaf) wheelRaf = requestAnimationFrame(flushWheel);
    }

    showScrollbar(el);
    if (!el.matches(":hover")) hideScrollbarLater(el);
  },
  { capture: true, passive: false },
);
