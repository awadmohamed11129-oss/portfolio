import { PortfolioLink } from "./ProjectBrowser";
import { about, profile } from "@/content/profile";
import { AboutRoom } from "./AboutRoom";
import styles from "./AboutContent.module.css";
export function AboutContent() {
  return <section className={`portfolio-page ${styles.page}`} data-content-interaction>
    <AboutRoom />
    <header className={styles.introduction}>
      <p className={styles.location}>About me / {profile.location}</p><h1>Mohamad<br />Awad.</h1>
      <p className={styles.lead}>{profile.intro}</p>
      <figure className={styles.portrait}>
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/images/headshot.jpg" alt="Mohamad Awad" width={1000} height={1000} />
        <figcaption><span>Civil engineering student</span>Toronto Metropolitan University<span className={styles.portraitLocation}>{profile.location}</span></figcaption>
      </figure>
      <nav className={styles.actions} aria-label="Get to know Mohamad"><PortfolioLink href="/projects">See my work</PortfolioLink><PortfolioLink href="/resume">Read my resume</PortfolioLink></nav>
    </header>
    <section className={styles.story} aria-labelledby="approach-heading"><h2 id="approach-heading">Engineering judgement.<br />Practical software.</h2>{about.map((paragraph, index) => <div key={paragraph}><p>{paragraph}</p>{index === 1 && <figure className={styles.workFigure}>
      <PortfolioLink href="/projects/pavescan-ai">
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/media/work/pavescan/03_dashcam_crack_grate-found.jpg" alt="PaveScan output over a Toronto dashcam frame: coloured model boxes trace possible cracks and flag a possible manhole." width={1600} height={900} loading="lazy" />
      </PortfolioLink>
      <figcaption>A frame from my PaveScan work. The coloured boxes are model findings that still need checking. <PortfolioLink href="/projects/pavescan-ai">See how I review them</PortfolioLink></figcaption>
    </figure>}</div>)}</section>
    <section className={styles.next} aria-labelledby="next-heading"><h2 id="next-heading">Let’s put it to work.</h2><p>I’m looking for a civil engineering co-op or placement involving infrastructure, data, or automation.</p><PortfolioLink href="/contact">Get in touch</PortfolioLink></section>
    <p className={styles.disclosure}>An imagined workspace, built for this portfolio.</p>
  </section>;
}
