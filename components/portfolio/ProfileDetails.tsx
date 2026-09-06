import { about, contact, profile } from "@/content/profile";
import styles from "./Content.module.css";

export function ProfileDetails() {
  return <div className={styles.profileBody}><p className={styles.profileIntro}>{profile.intro}</p>{about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>;
}

export function ContactDetails() {
  return <section className={styles.contact} aria-label="Contact details"><h2>{contact.heading}</h2><p>{contact.blurb}</p><ul>{contact.links.map(link => <li key={link.label}>
    <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}><span>{link.label}</span><span>{link.display}</span></a>
  </li>)}</ul></section>;
}

