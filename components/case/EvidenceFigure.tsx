"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Media } from "@/content/types";
import styles from "./Case.module.css";

export function EvidenceFigure({ media }: { media: Media }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <figure className={styles.figure} data-evidence-image>
    <button className={styles.fullImage} type="button" onClick={() => dialog.current?.showModal()} aria-label={`View evidence: ${media.alt}`}>
      <Image src={media.src} alt={media.alt} width={media.width} height={media.height} sizes="280px" />
      <span>View full resolution</span>
    </button>
    {media.caption && <figcaption>{media.caption}</figcaption>}
    <dialog ref={dialog} className={styles.lightbox} aria-label="Full-resolution evidence" onClick={event => {
      if (event.target === dialog.current) dialog.current.close();
    }}>
      <div className={styles.lightboxContent}>
        <form method="dialog"><button autoFocus type="submit">Close image</button></form>
        {/* The original file is intentional here: evidence must remain readable at its native resolution. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt} width={media.width} height={media.height} loading="lazy" />
        {media.caption && <p>{media.caption}</p>}
        <a href={media.src} target="_blank" rel="noopener noreferrer">Open original image<span className={styles.srOnly}> (opens in a new tab)</span></a>
      </div>
    </dialog>
  </figure>;
}
