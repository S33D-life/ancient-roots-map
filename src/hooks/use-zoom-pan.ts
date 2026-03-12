import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useZoomPan — Reusable zoom & pan interaction layer for S33D visualisations.
 *
 * Supports:
 *   - Mouse wheel zoom (centered on cursor)
 *   - Pinch zoom (mobile, centered on touch midpoint)
 *   - Drag/pan navigation
 *   - Double-click/tap to zoom-in and center
 *   - Programmatic focusOn(x, y, zoom)
 *   - Keyboard +/- zoom, arrow pan
 *   - Configurable min/max zoom and bounds
 */

export interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
  /** Zoom speed multiplier (default 1) */
  zoomSpeed?: number;
  /** Initial state */
  initial?: Partial<ZoomPanState>;
  /** Enable keyboard controls when container is focused (default true) */
  keyboard?: boolean;
  /** Called on every state change */
  onChange?: (state: ZoomPanState) => void;
}

const IDENTITY: ZoomPanState = { scale: 1, translateX: 0, translateY: 0 };

export function useZoomPan(options: UseZoomPanOptions = {}) {
  const {
    minScale = 0.5,
    maxScale = 5,
    zoomSpeed = 1,
    initial,
    keyboard = true,
    onChange,
  } = options;

  const [state, setState] = useState<ZoomPanState>({
    ...IDENTITY,
    ...initial,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const lastPinchMid = useRef({ x: 0, y: 0 });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // ── Helpers ───────────────────────────────────────────────
  const clampScale = useCallback(
    (s: number) => Math.min(maxScale, Math.max(minScale, s)),
    [minScale, maxScale],
  );

  const applyZoom = useCallback(
    (
      prevState: ZoomPanState,
      newScale: number,
      originX: number,
      originY: number,
    ): ZoomPanState => {
      const clamped = Math.min(maxScale, Math.max(minScale, newScale));
      const ratio = clamped / prevState.scale;
      return {
        scale: clamped,
        translateX: originX - (originX - prevState.translateX) * ratio,
        translateY: originY - (originY - prevState.translateY) * ratio,
      };
    },
    [minScale, maxScale],
  );

  const update = useCallback(
    (next: ZoomPanState | ((prev: ZoomPanState) => ZoomPanState)) => {
      setState((prev) => {
        const n = typeof next === "function" ? next(prev) : next;
        onChangeRef.current?.(n);
        return n;
      });
    },
    [],
  );

  // ── Wheel zoom ────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;
      const delta = -e.deltaY * 0.001 * zoomSpeed;

      update((prev) => applyZoom(prev, prev.scale * (1 + delta), originX, originY));
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [applyZoom, zoomSpeed, update]);

  // ── Pointer drag (mouse + touch-single) ───────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" && e.isPrimary === false) return;
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      update((prev) => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
      }));
    },
    [update],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── Touch pinch zoom ──────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      lastPinchMid.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2 || !containerRef.current) return;
      e.preventDefault();
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (lastPinchDist.current > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const originX = midX - rect.left;
        const originY = midY - rect.top;
        const scaleFactor = dist / lastPinchDist.current;

        update((prev) => applyZoom(prev, prev.scale * scaleFactor, originX, originY));
      }

      lastPinchDist.current = dist;
      lastPinchMid.current = { x: midX, y: midY };
    },
    [applyZoom, update],
  );

  const onTouchEnd = useCallback(() => {
    lastPinchDist.current = 0;
  }, []);

  // ── Double click → zoom to 2× centered ────────────────────
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;

      update((prev) => {
        // Toggle: if already zoomed > 1.5, reset; else zoom to 2×
        if (prev.scale > 1.5) return IDENTITY;
        return applyZoom(prev, 2, originX, originY);
      });
    },
    [applyZoom, update],
  );

  // ── Keyboard zoom + pan ───────────────────────────────────
  useEffect(() => {
    if (!keyboard) return;
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      const PAN_STEP = 40;
      const ZOOM_STEP = 0.15;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          update((prev) => ({
            ...prev,
            scale: clampScale(prev.scale + ZOOM_STEP),
          }));
          break;
        case "-":
        case "_":
          e.preventDefault();
          update((prev) => ({
            ...prev,
            scale: clampScale(prev.scale - ZOOM_STEP),
          }));
          break;
        case "ArrowLeft":
          e.preventDefault();
          update((prev) => ({ ...prev, translateX: prev.translateX + PAN_STEP }));
          break;
        case "ArrowRight":
          e.preventDefault();
          update((prev) => ({ ...prev, translateX: prev.translateX - PAN_STEP }));
          break;
        case "ArrowUp":
          e.preventDefault();
          update((prev) => ({ ...prev, translateY: prev.translateY + PAN_STEP }));
          break;
        case "ArrowDown":
          e.preventDefault();
          update((prev) => ({ ...prev, translateY: prev.translateY - PAN_STEP }));
          break;
        case "0":
          e.preventDefault();
          update(IDENTITY);
          break;
      }
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [keyboard, clampScale, update]);

  // ── Programmatic focus ────────────────────────────────────
  const focusOn = useCallback(
    (x: number, y: number, targetScale = 2.5) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const clamped = clampScale(targetScale);

      update({
        scale: clamped,
        translateX: centerX - x * clamped,
        translateY: centerY - y * clamped,
      });
    },
    [clampScale, update],
  );

  const reset = useCallback(() => update(IDENTITY), [update]);

  // ── Transform CSS ─────────────────────────────────────────
  const transformStyle: React.CSSProperties = {
    transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  /** Bind these to the container element */
  const containerProps = {
    ref: containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onDoubleClick,
    tabIndex: 0,
    style: { touchAction: "none", outline: "none" } as React.CSSProperties,
  };

  return {
    state,
    containerRef,
    containerProps,
    transformStyle,
    focusOn,
    reset,
    isZoomed: state.scale > 1.05 || Math.abs(state.translateX) > 5 || Math.abs(state.translateY) > 5,
  };
}
