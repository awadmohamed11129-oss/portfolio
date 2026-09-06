"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { PortfolioLink } from "./ProjectBrowser";
import { bindRoomMovement, type RoomView } from "./roomMovement";
import styles from "./AboutRoom.module.css";
export function AboutRoom() {
  const [view, setView] = useState<RoomView>({ x: 0, y: 0 });
  const viewHost = useRef<HTMLDivElement>(null);
  const movement = useRef<ReturnType<typeof bindRoomMovement> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!viewHost.current) return;
    movement.current = bindRoomMovement(viewHost.current, setView);
    return () => { movement.current?.dispose(); movement.current = null; };
  }, []);
  function openProfile() { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog.current?.showModal(); }
  return <>
    <aside className={styles.room} aria-label="About room preview" data-room-variant="photographic">
      <div ref={viewHost} className={styles.view} tabIndex={0} role="group" aria-label="Photographic room view" aria-describedby="room-movement-help" data-view-x={view.x.toFixed(3)} data-view-y={view.y.toFixed(3)}>
      <div className={styles.photoPlane} style={{ transform: `translateX(-56%) translate(${view.x * 1.8}%, ${view.y * 1.4}%) scale(1.055)` }}>
        {/* eslint-disable @next/next/no-img-element */}
        <img className={styles.roomPhoto} src="/assets/about-room-photo-v1.webp" alt="A warm, sunlit study with a wooden desk, books and plants. An imagined room for this portfolio." width={1672} height={941} draggable={false} />
        {/* eslint-disable @next/next/no-img-element */}
        <img className={styles.framedPortrait} src="/images/headshot.jpg" alt="Portrait of Mohamad Awad" width={1000} height={1000} draggable={false} />
        <button type="button" className={styles.monitor} onClick={openProfile} aria-label="Open my profile on the room computer"><span>Mohamad Awad<small>Open my profile</small></span></button>
      </div>
      </div>
      <span id="room-movement-help" className={styles.keyboardHelp}>Arrow keys move; Home resets.</span>
    </aside>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="room-profile-title" onClose={() => opener.current?.focus()} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={styles.profile}><form method="dialog"><button autoFocus aria-label="Close profile">Close</button></form>
        <p className={styles.note}>At my desk</p><h2 id="room-profile-title">Mohamad Awad</h2><p>{profile.intro}</p>
        <nav aria-label="Explore my profile"><PortfolioLink href="/projects">Explore my projects</PortfolioLink><PortfolioLink href="/resume">Read my resume</PortfolioLink></nav>
      </div>
    </dialog>
  </>;
}
