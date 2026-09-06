"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { contact, profile } from "@/content/profile";
import { DIRECT } from "@/content/links";
import { PortfolioLink } from "./ProjectBrowser";
import styles from "./ProfilePages.module.css";

const email = contact.links.find(link => link.label === "Email")!.display;

export function ContactContent() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return <section className={`portfolio-page ${styles.page} ${styles.contactPage}`} data-content-interaction>
    <header className={styles.contactHeader}>
      <p className={styles.location}>Contact / {profile.location}</p>
      <h1 className={styles.display}>Let’s talk.</h1>
      <p className={styles.lead}>{contact.blurb}</p>
    </header>
    <section className={styles.emailPanel} aria-label="Email Mohamad">
      <div className={styles.emailAddress}>
        <a href={DIRECT.email}>{email}</a>
      </div>
      <div className={styles.actions}>
        <a className={styles.primaryAction} href={DIRECT.email}><Mail size={18} aria-hidden="true" />Write an email</a>
        <button className={styles.secondaryAction} type="button" onClick={copyEmail}>
          {copyState === "copied" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
          {copyState === "copied" ? "Email copied" : "Copy email"}
        </button>
      </div>
      <p className={styles.copyStatus} role="status" aria-live="polite">{copyState === "copied" ? "Email address copied to your clipboard." : copyState === "failed" ? "Couldn’t copy automatically. Select the address to copy it, or choose Write an email." : ""}</p>
    </section>
    <div className={styles.contactElsewhere}>
      <h2>Find me elsewhere</h2>
      <ul>{contact.links.filter(link => link.label !== "Email").map(link => <li key={link.label}>
        {link.label === "Resume" ? <PortfolioLink href="/resume"><span><strong>Resume</strong><span>Overview and PDF</span></span><ArrowUpRight size={20} aria-hidden="true" /></PortfolioLink> : <a href={link.href} target="_blank" rel="noopener noreferrer"><span><strong>{link.label}</strong><span>{link.display}</span></span><ArrowUpRight size={20} aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a>}
      </li>)}</ul>
    </div>
  </section>;
}
