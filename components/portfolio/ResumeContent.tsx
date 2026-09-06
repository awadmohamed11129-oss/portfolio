import { Download, FileText } from "lucide-react";
import { profile } from "@/content/profile";
import { roles } from "@/content/experience";
import { DIRECT } from "@/content/links";
import { PortfolioLink } from "./ProjectBrowser";
import styles from "./ProfilePages.module.css";

export function ResumeContent() {
  return <section className={`portfolio-page ${styles.page} ${styles.resumePage}`} data-content-interaction>
    <header className={styles.resumeHeader}>
      <div><h1 className={styles.display}>Resume.</h1><p className={styles.lead}>{profile.name}<br />Civil engineering student at TMU.</p></div>
      <div className={styles.resumeActions}>
        <a className={styles.primaryAction} href={DIRECT.resume} download="Mohamad_Awad_Resume.pdf"><Download size={17} aria-hidden="true" />Download PDF</a>
        <a className={styles.secondaryAction} href={DIRECT.resume} target="_blank" rel="noopener noreferrer"><FileText size={17} aria-hidden="true" />View PDF<span className={styles.srOnly}> in a new tab</span></a>
      </div>
    </header>
    <div className={styles.resumeOverview}>
        <section id="education" className={styles.resumeSection}>
          <h2>Education</h2>
          <h3>Civil engineering</h3>
          <p className={styles.organization}>Toronto Metropolitan University</p>
          <p className={styles.roleMeta}>Current student / Toronto, ON</p>
        </section>
        <section id="work-experience" className={styles.resumeSection}>
          <h2>Experience</h2>
          {roles.map(role => <article key={role.title} className={styles.resumeRole}>
            <p className={styles.roleMeta}>{role.dates}</p>
            <h3>{role.title}</h3>
            <p className={styles.organization}>{role.company}</p>
          </article>)}
          <PortfolioLink className={styles.secondaryAction} href="/experience">Explore my experience</PortfolioLink>
        </section>
    </div>
    <nav className={styles.resumeMore} aria-label="More about my work">
      <PortfolioLink className={styles.secondaryAction} href="/projects">View projects</PortfolioLink>
      <PortfolioLink className={styles.secondaryAction} href="/contact">Get in touch</PortfolioLink>
    </nav>
  </section>;
}
