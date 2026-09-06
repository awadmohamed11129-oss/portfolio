"use client";

import Image from "next/image";
import { useId, useRef, useState, type PointerEvent } from "react";
import { PaveScanImageViewer } from "./PaveScanImageViewer";
import styles from "./PaveScanWorkVisual.module.css";

const samples = [
  { id: "03_dashcam_crack_grate", label: "Cracks & grate", width: 2560, height: 1440, note: "Cracking beside a drainage grate. The model also flags a possible utility cover." },
  { id: "02_dashcam_pothole_manhole", label: "Utility cover", width: 2560, height: 1440, note: "A useful mistake to inspect: a cover is initially called a pothole, then flagged as a possible manhole. A possible shadow remains visible." },
  { id: "04_dashcam_clean_road", label: "Clean road", width: 2560, height: 1440, note: "The negative control: this saved run returned no findings on the clean road image." },
  { id: "01_street_pothole", label: "Street pothole", width: 1200, height: 1600, note: "A street-level sample showing an open pothole and surrounding cracking." },
] as const;

export function PaveScanWorkVisual({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [split, setSplit] = useState(50);
  const [viewerOpen, setViewerOpen] = useState(false);
  const gesture = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const sample = samples[selected];
  const hintId = useId();
  const path = `/media/work/pavescan/${sample.id}`;
  function position(event: PointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setSplit(Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))));
  }
  return <section className={styles.visual} data-work-visual="pavescan-ai" aria-label="PaveScan image comparison">
    <div className={styles.heading}><span>The image. The model’s findings.</span><button type="button" onClick={() => setViewerOpen(true)}>Enlarge images</button></div>
    <div className={styles.comparison}>
      <Image className={styles.source} src={`${path}.jpg`} alt={`Original sample: ${sample.label}`} width={sample.width} height={sample.height} sizes="(min-width: 1024px) 44vw, 95vw" unoptimized />
      <div className={styles.result} style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <Image src={`${path}-found.jpg`} alt={`Saved model findings: ${sample.label}`} width={sample.width} height={sample.height} sizes="(min-width: 1024px) 44vw, 95vw" unoptimized data-comparison-result />
      </div>
      <div className={styles.labels} aria-hidden="true"><span style={{ visibility: split === 0 ? "hidden" : "visible" }}>Original</span><span style={{ visibility: split === 100 ? "hidden" : "visible" }}>Model output</span></div>
      <div className={styles.divider} style={{ left: `${split}%` }} aria-hidden="true"><span>‹ ›</span></div>
      <input type="range" min="0" max="100" step="1" value={split}
        aria-label="Compare original image and model findings" aria-valuetext={`${split}% original image visible`} aria-describedby={hintId}
        onChange={event => setSplit(Number(event.target.value))}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = { x: event.clientX, y: event.clientY, dragged: false };
        }}
        onPointerMove={event => {
          if (!gesture.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 6) gesture.current.dragged = true;
          if (gesture.current.dragged) position(event);
        }}
        onPointerUp={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          if (gesture.current && !gesture.current.dragged) setViewerOpen(true);
          gesture.current = null;
        }}
        onPointerCancel={() => { gesture.current = null; }}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setViewerOpen(true); } }}
      />
    </div>
    <div className={styles.samples} aria-label="Choose a pavement sample">
      {samples.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setSplit(50); }}>
        <Image src={`/media/work/pavescan/${item.id}-thumb.jpg`} alt="" width={96} height={54} unoptimized />
        <span>{item.label}</span>
      </button>)}
    </div>
    {!compact && <p className={styles.description} aria-live="polite">{sample.note}</p>}
    <p className={styles.caption} id={hintId}>Actual saved input and software output. AI flags need review. Drag to compare; click or tap to enlarge. Arrow keys compare, Enter enlarges.</p>
    {!compact && <div className={styles.fullSize}>
      <a href={`${path}.jpg`} target="_blank" rel="noopener noreferrer">Full-size original<span className={styles.srOnly}> (opens in a new tab)</span></a>
      <a href={`${path}-found.jpg`} target="_blank" rel="noopener noreferrer">Full-size model output<span className={styles.srOnly}> (opens in a new tab)</span></a>
    </div>}
    <PaveScanImageViewer open={viewerOpen} onClose={() => setViewerOpen(false)} path={path} label={sample.label} width={sample.width} height={sample.height} split={split} />
  </section>;
}
