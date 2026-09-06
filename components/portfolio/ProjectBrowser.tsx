"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ProjectTeaser } from "@/content/types";
import { usePortfolio } from "@/components/shell/PortfolioProvider";
import { ProjectWorkVisual } from "./ProjectWorkVisual";
import styles from "./Content.module.css";
import work from "./Projects.module.css";

/** Preserve link semantics while ordinary activation uses the world navigator. */
export function PortfolioLink({ href, onNavigate, children, className }: {
  href: string;
  onNavigate?: (href: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const { navigate } = usePortfolio();
  return <Link href={href} className={className} onClick={event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      (onNavigate ?? navigate)(href);
    }
  }}>{children}</Link>;
}

export function ProjectBrowser({ projects, featured = false, onNavigate }: {
  projects: readonly ProjectTeaser[];
  featured?: boolean;
  onNavigate?: (href: string) => void;
}) {
  if (featured) {
    const studies = projects.filter(project => project.href);
    const coursework = projects.filter(project => !project.href);
    return <div>
      <section className={work.projectGallery} aria-label="Project collection">
        {studies.map(project => {
          const sentence = project.href === "/projects/civic-data-pipeline"
            ? project.blurb.split(". ")[1].split(", including")[0]
            : project.blurb.split(". ")[0];
          const result = sentence.replace(/\.$/, "") + ".";
          return <article id={project.href!.split("/").pop()} className={work.project} key={project.href}>
            <div className={work.projectCopy}>
              <p className={work.context}>{project.context}</p>
              <h2><PortfolioLink href={project.href!} onNavigate={onNavigate}>{project.title}</PortfolioLink></h2>
              <p className={work.projectDescription}>{result}</p>
            </div>
            <ProjectWorkVisual slug={project.href!.split("/").pop()!} compact />
            <PortfolioLink href={project.href!} onNavigate={onNavigate} className={work.caseLink}>Explore the project<span className={work.srOnly}>: {project.title}</span></PortfolioLink>
          </article>;
        })}
      </section>
      {coursework.length > 0 && <section className={work.coursework} aria-label="Coursework">
        {coursework.map(project => <article key={project.title}>
          <p className={work.context}>{project.context}</p><h2>{project.title}</h2>
          <p>{project.blurb}</p><p className={work.courseworkNote}>{project.noteInPlaceOfLink}</p>
        </article>)}
      </section>}
      {projects.length === 0 && <p>No projects to show yet.</p>}
    </div>;
  }
  return <div className={styles.browser}>
    <section className={styles.collection} aria-label="Project collection">
      <div className={styles.collectionHeading}><h2>All work</h2><p>{projects.length} entries</p></div>
      {projects.length === 0 ? <p>No projects to show yet.</p> : <div className={styles.collectionRows}>
        {projects.map((project, index) => <article className={styles.collectionRow} key={`${project.href ?? project.title}-${index}`}>
          <div><h3>{project.href ? <PortfolioLink href={project.href} onNavigate={onNavigate}>{project.title}</PortfolioLink> : project.title}</h3><p className={styles.context}>{project.context}</p></div>
          <div><p>{project.blurb}</p><ul className={styles.tags}>{project.chips.map(chip => <li key={chip}>{chip}</li>)}</ul>
            {project.href ? <PortfolioLink href={project.href} onNavigate={onNavigate} className={styles.textLink}>Read case study<span className={styles.srOnly}>: {project.title}</span></PortfolioLink> : <p className={styles.coursework}>{project.noteInPlaceOfLink}</p>}
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}


