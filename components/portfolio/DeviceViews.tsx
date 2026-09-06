"use client";
import { teasers } from "@/content/projects";
import { profile } from "@/content/profile";
import type { DeviceId } from "@/lib/portfolio/contracts";
import { ProjectBrowser, PortfolioLink } from "./ProjectBrowser";
import { ProfileDetails, ContactDetails } from "./ProfileDetails";
import styles from "./Content.module.css";

export function DeviceViews({ device, onNavigate }: { device: DeviceId; onNavigate: (href: string) => void }) {
  return <div className={`${styles.device} ${device === "phone" ? styles.phone : ""}`} data-content-interaction>
    {device === "monitor" ? <>
      <header className={styles.deviceHeader}><h2>My projects</h2><PortfolioLink href="/projects" onNavigate={onNavigate}>Open projects page</PortfolioLink></header>
      <ProjectBrowser projects={teasers} onNavigate={onNavigate} />
    </> : <>
      <header className={styles.deviceHeader}><h2>{profile.name}</h2><p>{profile.location}</p></header>
      <ProfileDetails /><ContactDetails />
      <nav className={styles.deviceLinks} aria-label="More about Mohamad"><PortfolioLink href="/about" onNavigate={onNavigate}>Full profile</PortfolioLink><PortfolioLink href="/experience" onNavigate={onNavigate}>Experience</PortfolioLink></nav>
    </>}
  </div>;
}
