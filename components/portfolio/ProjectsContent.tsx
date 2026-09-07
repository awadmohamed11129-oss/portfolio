import { teasers } from "@/content/projects";
import type { ProjectTeaser } from "@/content/types";
import { ProjectBrowser } from "./ProjectBrowser";
import styles from "./Projects.module.css";

export function ProjectsContent({ projects = teasers }: { projects?: readonly ProjectTeaser[] }) {
  return <section className="portfolio-page" data-content-interaction>
    <header className={styles.pageHeading}>
      <h1>Projects</h1>
      <p>What I built, the problems it solves, and what I learned.</p>
    </header>
    <ProjectBrowser projects={projects} featured />
  </section>;
}

