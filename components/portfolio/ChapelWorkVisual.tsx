"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowDown, ArrowUpRight, FileText, Maximize2, Minimize2 } from "lucide-react";
import styles from "./ChapelWorkVisual.module.css";

const samples = [
  {
    id: "couples-info",
    label: "Couples information",
    detail: "The couple’s schedule, ceremony details and confirmed add-ons, together in one brief.",
    alt: "Actual sample couples information sheet for Sarah Patel and Mark Reyes, showing their package, ceremony, venue and music",
  },
  {
    id: "vendor-run-sheet",
    label: "Vendor run sheet",
    detail: "One shared timeline for the coordinator, photographer, florist, musicians and officiant.",
    alt: "Actual sample vendor run sheet with three couples and a colour-coded master timeline for the wedding team",
  },
  {
    id: "packing-list",
    label: "Packing list",
    detail: "A day-of checklist derived from the packages, venue and add-ons across the chapel day.",
    alt: "Actual sample packing list with chapel decor, marriage licence materials, technical equipment and a critical alert",
  },
  {
    id: "posting-guide",
    label: "Posting guide",
    detail: "Caption drafts, vendor tags and signage copy carry the same booking details through to sharing the day.",
    alt: "Actual sample posting guide with three caption drafts, vendor tags, hashtags and day-of signage copy",
  },
] as const;

export function ChapelWorkVisual({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const previewId = useId();
  const sample = samples[selected];

  return (
    <section
      className={`${styles.visual} ${compact ? styles.compact : ""}`}
      data-work-visual="pop-up-chapel"
      aria-label="Pop-Up Chapel document work samples"
    >
      <header className={styles.intro}>
        <p className={styles.eyebrow}>The Pop-Up Chapel Co. <span>Sample output</span></p>
        <p className={styles.headline}>One booking.<br />Ready for the day.</p>
        <div className={styles.booking}>
          <span className={styles.bookingMark} aria-hidden="true">S<span>&amp;</span>M</span>
          <div><strong>Sarah Patel &amp; Mark Reyes</strong><span>18 October 2026 · The Pipe Shop, Vancouver</span></div>
        </div>
      </header>

      <div className={styles.flow}><span>Booking details</span><ArrowDown size={13} aria-hidden="true" /><span>Branded document set</span></div>

      <div className={styles.documents}>
        <div className={styles.selector} role="group" aria-label="Choose a sample document">
          {samples.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === index}
              aria-controls={previewId}
              onClick={() => { setSelected(index); setZoomed(false); }}
            >
              <span className={styles.fileNumber} aria-hidden="true">0{index + 1}</span>{item.label}
            </button>
          ))}
        </div>

        <div className={styles.previewBar}>
          <span><FileText size={13} aria-hidden="true" />Page 1 of 2 · scroll to inspect</span>
          <button type="button" onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed} aria-controls={previewId}>
            {zoomed ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
            {zoomed ? "Fit page" : "Enlarge"}
          </button>
        </div>
        <div
          key={`${sample.id}-${zoomed}`}
          id={previewId}
          className={`${styles.preview} ${zoomed ? styles.zoomed : ""}`}
          tabIndex={0}
          role="region"
          aria-label={`${sample.label}, scrollable first-page preview`}
        >
          <Image
            src={`/media/work/chapel-${sample.id}.webp`}
            alt={sample.alt}
            width={918}
            height={1188}
            sizes="(max-width: 700px) 95vw, 700px"
            className={styles.paper}
          />
        </div>
        <div className={styles.outputNote}>
          <p aria-live="polite">{sample.detail}</p>
          <a href={`/pdfs/popup-chapel-${sample.id}.pdf`} target="_blank" rel="noopener noreferrer">
            Open sample PDF <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>

      {!compact && <details className={styles.companion}>
        <summary><span>Saved companion tool</span><span className={styles.companionAction}>View interface <span aria-hidden="true">+</span></span></summary>
        <div className={styles.companionBody}>
          <Image
            src="/images/popup-chapel/live-site-home.png"
            alt="Saved view of the companion tool: a chapel-day selector, Generate documents button and explanation of its Google Sheet source"
            width={1425}
            height={944}
            sizes="(max-width: 700px) 95vw, 700px"
          />
          <p>The browser companion rebuilt documents from a Google Sheet. This is a saved interface; the controls in the image are not interactive. Intake and account-ownership handoff were unfinished.</p>
        </div>
      </details>}
      <p className={styles.provenance}>Existing engagement samples · document-generation workstream</p>
    </section>
  );
}
