"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./PaveScanImageViewer.module.css";

type View = { zoom: number; x: number; y: number };
type Point = { x: number; y: number };
const FIT: View = { zoom: 1, x: 0, y: 0 };

export function PaveScanImageViewer({ open, onClose, path, label, width, height, split }: {
  open: boolean; onClose: () => void; path: string; label: string; width: number; height: number;
  split: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(FIT);
  const [comparison, setComparison] = useState(split);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ start: Point; view: View } | null>(null);
  const pinch = useRef<{ distance: number; centre: Point; view: View } | null>(null);

  const clamp = useCallback((next: View): View => {
    const element = surface.current;
    if (!element) return next;
    const fit = Math.min(element.clientWidth / width, element.clientHeight / height);
    const maxX = Math.max(0, (width * fit * next.zoom - element.clientWidth) / 2);
    const maxY = Math.max(0, (height * fit * next.zoom - element.clientHeight) / 2);
    return { zoom: next.zoom, x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) };
  }, [width, height]);
  function zoomBy(amount: number) {
    setView(current => clamp({ ...current, zoom: Math.max(1, Math.min(6, Math.round((current.zoom + amount) * 10) / 10)) }));
  }

  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pointers.current.clear();
    setView(FIT);
    setComparison(split);
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open, split]);

  useEffect(() => {
    if (!open) return;
    const element = surface.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY === 0) return;
      const step = event.deltaY < 0 ? .2 : -.2;
      const bounds = element.getBoundingClientRect();
      const point = { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 };
      setView(current => {
        const zoom = Math.max(1, Math.min(6, Math.round((current.zoom + step) * 10) / 10));
        const ratio = zoom / current.zoom;
        // Keep the image point beneath the cursor fixed as the scale changes.
        return clamp({ zoom, x: point.x - (point.x - current.x) * ratio, y: point.y - (point.y - current.y) * ratio });
      });
    };
    const resize = new ResizeObserver(() => setView(current => clamp(current)));
    resize.observe(element);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => { resize.disconnect(); element.removeEventListener("wheel", wheel); };
  }, [open, clamp]);

  function begin(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    drag.current = { start: point, view };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view };
    }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const gesture = pinch.current;
      setView(clamp({ zoom: Math.max(1, Math.min(6, gesture.view.zoom * Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance)), x: gesture.view.x + (a.x + b.x) / 2 - gesture.centre.x, y: gesture.view.y + (a.y + b.y) / 2 - gesture.centre.y }));
    } else if (drag.current) {
      setView(clamp({ ...drag.current.view, x: drag.current.view.x + event.clientX - drag.current.start.x, y: drag.current.view.y + event.clientY - drag.current.start.y }));
    }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    const remaining = [...pointers.current.values()][0];
    drag.current = remaining ? { start: remaining, view } : null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "+" || event.key === "=") zoomBy(.5);
      else if (event.key === "-") zoomBy(-.5);
      else if (event.key === "0") setView(FIT);
      else setView(current => clamp({ ...current, x: current.x + (event.key === "ArrowLeft" ? 40 : event.key === "ArrowRight" ? -40 : 0), y: current.y + (event.key === "ArrowUp" ? 40 : event.key === "ArrowDown" ? -40 : 0) }));
    }
  }
  const transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
  return <dialog className={styles.dialog} ref={dialog} aria-label="PaveScan image viewer" onCancel={onClose}>
    {open && <div className={styles.layout}>
      <header className={styles.header}><div><p>PaveScan AI</p><h2>{label}</h2></div><button type="button" onClick={onClose} autoFocus>Close image viewer</button></header>
      <div className={styles.tools} role="group" aria-label="Image magnification">
        <button type="button" onClick={() => zoomBy(-.5)} disabled={view.zoom <= 1}>Zoom out</button>
        <output aria-label="Zoom level">{Math.round(view.zoom * 100)}%</output>
        <button type="button" onClick={() => zoomBy(.5)} disabled={view.zoom >= 6}>Zoom in</button>
        <button type="button" onClick={() => setView(FIT)}>Reset view</button>
      </div>
      <div className={styles.surface} ref={surface} tabIndex={0} role="region" aria-label="Enlarged comparison. Drag to pan; plus and minus to zoom; arrow keys to pan; zero to reset."
        data-testid="image-viewer-surface" data-zoom={view.zoom} data-pan-x={view.x} data-pan-y={view.y}
        onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={keyboard}
        onDoubleClick={() => view.zoom === 1 ? zoomBy(1) : setView(FIT)}>
        <Image className={styles.image} src={`${path}.jpg`} alt={`Original sample: ${label}`} width={width} height={height} unoptimized draggable={false} style={{ transform }} />
        <div className={styles.result} style={{ clipPath: `inset(0 0 0 ${comparison}%)` }}>
          <Image className={styles.image} src={`${path}-found.jpg`} alt={`Saved model findings: ${label}`} width={width} height={height} unoptimized draggable={false} style={{ transform }} />
        </div>
        <div className={styles.divider} style={{ left: `${comparison}%` }} aria-hidden="true" />
        <div className={styles.labels} aria-hidden="true"><span style={{ visibility: comparison === 0 ? "hidden" : "visible" }}>Original</span><span style={{ visibility: comparison === 100 ? "hidden" : "visible" }}>Model output</span></div>
      </div>
      <div className={styles.compare}>
        <label htmlFor="enlarged-comparison">Compare images</label>
        <input id="enlarged-comparison" type="range" min="0" max="100" value={comparison} aria-label="Compare enlarged original and model output" aria-valuetext={`${comparison}% original image visible`} onChange={event => setComparison(Number(event.target.value))} />
      </div>
      <p className={styles.hint}>Scroll or pinch to zoom. Drag to move around the image. Use the slider to compare. These are saved AI findings, not confirmed defects.</p>
    </div>}
  </dialog>;
}
