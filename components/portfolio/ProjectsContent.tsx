import { teasers } from "@/content/projects";
import type { ProjectTeaser } from "@/content/types";
import { ProjectBrowser } from "./ProjectBrowser";
import styles from "./Projects.module.css";

export function ProjectsContent({ projects = teasers }: { projects?: readonly ProjectTeaser[] }) {
  return <section className="portfolio-page" data-content-interaction>
    <header className={styles.pageHeading}>
      <p className={styles.eyebrow}>Projects</p><h1>Selected work</h1>
      <p>Pavement inspection, public data, and tools made for a specific job. A closer look at what I built, the decisions behind it, and the results.</p>
    </header>
    <ProjectBrowser projects={projects} featured />
  </section>;
}

