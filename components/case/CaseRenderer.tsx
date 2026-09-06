import Image from "next/image";
import { projectHeroMedia } from "@/components/portfolio/projectPresentation";
import { ProjectWorkVisual } from "@/components/portfolio/ProjectWorkVisual";
import { EvidenceFigure as Figure } from "./EvidenceFigure";
import { PortfolioLink as Link } from "@/components/portfolio/ProjectBrowser";
import type { ReactNode } from "react";
import type { Block, CaseLink, CaseStudy } from "@/content/types";
import { go } from "@/content/links";
import { Diagram } from "./diagrams";
import styles from "./Case.module.css";

function Paragraphs({ body }: { body: readonly string[] }) {
  return <div className={styles.prose}>{body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose": return <Paragraphs body={block.body} />;
    case "figure": return <Figure media={block.media} />;
    case "figureGrid": return <div className={styles.figureGrid}>{block.media.map(media => <Figure media={media} key={media.src + media.caption} />)}</div>;
    case "stat": return <>
      <dl className={styles.stats}>{block.items.map(item => <div key={item.label}>
        <dt>{item.label}</dt><dd>{item.fact.value}
          {(item.note || item.fact.scope) && <p>{item.note ?? item.fact.scope}</p>}
          {item.note && item.fact.scope && /historical|August/i.test(item.fact.scope) && <p>{item.fact.scope}</p>}
        </dd>
      </div>)}</dl>
      {block.note && <p className={styles.note}>{block.note}</p>}
    </>;
    case "quote": return <figure className={styles.quote}><blockquote>{block.text}</blockquote><figcaption>{block.attribution}</figcaption></figure>;
    case "list": return <ul className={block.style === "bullets" ? styles.bullets : styles.items}>{block.items.map((item, index) => <li key={index}>
      {item.title && <h3>{item.title}</h3>}<Paragraphs body={item.body} />
    </li>)}</ul>;
    case "callout": return <Paragraphs body={block.body} />;
    case "diagram": return <>
      <div className={styles.diagram}><Diagram id={block.id} /></div>
      {block.note && <p className={styles.note}>{block.note}</p>}
    </>;
  }
}

function OutboundLink({ link }: { link: CaseLink }) {
  const href = link.slug ? go(link.slug as Parameters<typeof go>[0]) : link.href;
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{link.label}<span className={styles.srOnly}> (opens in a new tab)</span></a> : null;
}

export function CaseRenderer({ study, setPiece }: { study: CaseStudy; setPiece?: ReactNode }) {
  const at = study.setPiece?.after;
  const heroMedia = projectHeroMedia[`/projects/${study.slug}`];
  const sections = study.blocks.map((block, index) => ({
    block,
    id: `${study.slug}-${index}-${(block.heading ?? "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`,
  }));
  return <article className={styles.case} data-content-interaction>
    <header className={styles.header}>
      <Link href="/projects" className={styles.back}>All projects</Link>
      <p className={styles.context}>{study.slug === "civic-data-pipeline" ? "Data Engineer work placement, May to July 2026" : study.eyebrow}</p>
      <h1>{study.title}</h1>
      <p className={styles.summary}>{study.summary}</p>
      <ProjectWorkVisual slug={study.slug} />
      {heroMedia && ["pavescan-ai", "civic-data-pipeline"].includes(study.slug) && <figure className={styles.heroFigure} data-project-hero data-hero-source={heroMedia.sourceType}>
        <Image src={heroMedia.src} alt={heroMedia.alt} width={heroMedia.width} height={heroMedia.height} sizes="(min-width: 1024px) 44vw, 90vw" priority />
        <figcaption>{heroMedia.caption}{heroMedia.sourceHref && <> <a href={heroMedia.sourceHref} target="_blank" rel="noopener noreferrer">Source<span className={styles.srOnly}> (opens in a new tab)</span></a></>}</figcaption>
      </figure>}
      {study.links.length > 0 && <div className={styles.links}>{study.links.map(link => <OutboundLink link={link} key={link.label} />)}</div>}
      {study.linkNote && <p className={styles.linkNote}>{study.linkNote}</p>}
      {study.overview && <dl className={styles.overview}>{study.overview.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
    </header>
    <div className={styles.readingLayout}>
      <nav className={styles.contents} aria-label="In this case study"><p>In this case study</p><ul>{sections.filter(({ block }) => block.heading).map(({ block, id }) => <li key={id}><a href={`#${id}`}>{block.heading}</a></li>)}</ul></nav>
      <div className={styles.body}>

        {setPiece && at === undefined ? setPiece : null}
        {sections.map(({ block, id }, index) => <div key={id}>
          <section id={id} className={`${styles.block} ${block.kind === "callout" ? styles.callout : ""}`}>
            {block.heading && <h2>{block.heading}</h2>}
            <BlockView block={block} />
          </section>
          {setPiece && at === index ? setPiece : null}
        </div>)}
        {study.hero && study.slug !== "pop-up-chapel" && <section className={styles.block} aria-label="Project evidence"><h2>Project evidence</h2><Figure media={study.hero} /></section>}
        {study.stack && <section className={styles.block}><h2>Tools used</h2><dl className={styles.stack}>{study.stack.map(group => <div key={group.label}><dt>{group.label}</dt><dd>{group.items.join(", ")}</dd></div>)}</dl></section>}
        <footer className={styles.footer}><Link href="/projects">Back to all projects</Link><Link href="/experience">Read my experience</Link></footer>
      </div>
    </div>
  </article>;
}



