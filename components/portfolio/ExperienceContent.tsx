import Image from "next/image";
import { roles } from "@/content/experience";
import { skillGroups } from "@/content/skills";
import { DIRECT } from "@/content/links";
import { PortfolioLink } from "./ProjectBrowser";
import { PlacementWorkVisual } from "./PlacementWorkVisual";
import styles from "./ExperienceContent.module.css";

const roleAnchors = ["data-engineering", "campus-operations", "project-coordination"];

export function ExperienceContent() {
  return <section className={`portfolio-page ${styles.page}`} data-content-interaction>
    <header className={styles.pageHeading}>
      <h1>Experience</h1>
      <p>Data engineering, daily operations, and project coordination. Work where someone else depends on the details being right.</p>
      <a className={styles.textLink} href={DIRECT.resume} target="_blank" rel="noopener noreferrer">Download resume (PDF)</a>
    </header>
    <nav className={styles.index} aria-label="Experience sections">
      <a href="#data-engineering">Data engineering</a>
      <a href="#campus-operations">Campus operations</a>
      <a href="#project-coordination">Project coordination</a>
      <a href="#skills">Tools</a>
    </nav>
    <div className={styles.roles}>{roles.map((role, index) => <article id={roleAnchors[index]} className={styles.role} key={role.title + role.company}>
      {role.company === "Toronto Metropolitan University" && <figure className={styles.campusFigure}>
        <Image
          src="/media/experience/tmu-rac-entrance.webp"
          alt="The historic stone entrance to TMU's Recreation and Athletic Centre, framed by trees in the campus quad."
          width={1600}
          height={1200}
          sizes="(max-width: 1023px) 90vw, 620px"
        />
        <figcaption>
          <span>Recreation and Athletic Centre, TMU campus. 2022.</span>
          <span>Photo: <a href="https://commons.wikimedia.org/wiki/File:TMU_Recreation_and_Athletic_Centre_Entrance_2022.jpg" target="_blank" rel="noopener noreferrer">Canmenwalker</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Resized and cropped.</span>
        </figcaption>
      </figure>}
      <header className={styles.roleHeading}>
        <p className={styles.company}>{role.company}</p>
        <h2>{role.title}</h2>
        <div className={styles.roleMeta}><p>{role.dates}</p><p>{role.location}</p></div>
      </header>
      {role.title === "Data Engineer, work placement" ? <>
        <p className={styles.placementIntro}>I wrote software that turns Toronto’s public mobility data into consistent records, and checked service-request trends against the original data before handing them over.</p>
        <PlacementWorkVisual />
        <details className={styles.placementDetails}>
          <summary>Read the placement details</summary>
          <ul className={styles.responsibilities}>{role.bullets.map(item => <li key={item}>{item}</li>)}</ul>
        </details>
      </> : <ul className={styles.responsibilities}>{role.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
      {role.title === "Data Engineer, work placement" && <PortfolioLink className={styles.textLink} href="/projects/civic-data-pipeline">Explore the Civic Data Pipeline</PortfolioLink>}
    </article>)}</div>
    <section id="skills" className={styles.skills}>
      <header><h2>Tools I work with</h2><p>Used across coursework, independent projects, and placement work.</p></header>
      <dl>{skillGroups.map(group => <div key={group.label}><dt>{group.label}</dt><dd><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></dd></div>)}</dl>
    </section>
    <div className={styles.nextStep}><p>See the work behind the experience.</p><PortfolioLink href="/projects" className={styles.textLink}>Explore projects</PortfolioLink></div>
  </section>;
}
