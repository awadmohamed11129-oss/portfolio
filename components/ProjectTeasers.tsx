import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Teaser = {
  title: string;
  context: string;
  blurb: string;
  chips: string[];
  href?: string;
  image?: { src: string; alt: string };
};

const teasers: Teaser[] = [
  {
    title: "PaveScan AI",
    context: "Independent project · 2026",
    blurb:
      "YOLO11 segmentation that scores pavement against the ASTM D6433 PCI standard, with a Streamlit dashboard, an interactive Folium GPS map, and a PDF report generator.",
    chips: ["YOLO11", "Python", "Streamlit", "Folium"],
    href: "/projects/pavescan-ai",
    image: {
      src: "/images/pavescan/val_batch0_pred.webp",
      alt: "Grid of pavement images with YOLO11 crack-segmentation overlays",
    },
  },
  {
    title: "Civic Data Pipeline",
    context: "Work placement · Toronto smart-city startup · May–Jul 2026",
    blurb:
      "Production ETL for six City of Toronto mobility datasets plus a signal engine over eight years of 311 data, behind a live demo for a municipal government stakeholder. 800+ tests passing, zero teammate code touched.",
    chips: ["Python", "PostgreSQL", "ETL", "pytest"],
    href: "/projects/civic-data-pipeline",
    image: {
      src: "/images/civic-data/teaser.svg",
      alt: "Stylized chart of civic data signals rising over time",
    },
  },
  {
    title: "Pop-Up Chapel Co.",
    context: "Riipen consulting engagement · 60 hrs · Apr–May 2026",
    blurb:
      "Led the email-automation and document-generation workstream: a Python pipeline that turns one booking into eight branded wedding-day documents, plus a live Next.js companion tool on Vercel.",
    chips: ["Python", "Pydantic", "Next.js", "TypeScript"],
    href: "/projects/pop-up-chapel",
    image: {
      src: "/images/popup-chapel/live-site-home.png",
      alt: "Pop-Up Chapel companion-tool homepage",
    },
  },
  {
    title: "Engineering Design Project",
    context: "TMU course project · Feb–Mar 2025",
    blurb:
      "Mobile storage cart for unhoused individuals plus a walking-cane prototype — designed for durability, weather resistance, and one-handed mobility.",
    chips: ["CAD", "Prototyping"],
  },
];

function ProjectImage({ image }: { image: Teaser["image"] }) {
  if (!image) {
    return (
      <div className="aspect-[16/10] w-full rounded-md bg-secondary border border-border/40 overflow-hidden">
        <svg
          viewBox="0 0 640 400"
          role="img"
          aria-label="Drafting-style line drawing of the mobile storage cart design"
          className="h-full w-full"
        >
          {/* drafting grid */}
          <g stroke="currentColor" strokeWidth="1" className="text-border/50">
            {Array.from({ length: 15 }, (_, i) => (
              <line key={`v${i}`} x1={40 + i * 40} y1="0" x2={40 + i * 40} y2="400" />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={40 + i * 40} x2="640" y2={40 + i * 40} />
            ))}
          </g>
          {/* cart line drawing */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="text-foreground/70"
          >
            <rect x="200" y="150" width="240" height="130" rx="6" />
            <line x1="200" y1="215" x2="440" y2="215" />
            <path d="M440 160 L490 110 L510 110" strokeLinecap="round" />
            <circle cx="250" cy="305" r="24" />
            <circle cx="390" cy="305" r="24" />
            <circle cx="250" cy="305" r="4" fill="currentColor" stroke="none" />
            <circle cx="390" cy="305" r="4" fill="currentColor" stroke="none" />
          </g>
          {/* dimension line, terracotta */}
          <g stroke="currentColor" strokeWidth="1.5" className="text-primary/80">
            <line x1="200" y1="112" x2="440" y2="112" />
            <line x1="200" y1="104" x2="200" y2="120" />
            <line x1="440" y1="104" x2="440" y2="120" />
          </g>
        </svg>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-secondary border border-border/40">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </div>
  );
}

function Card({ teaser }: { teaser: Teaser }) {
  const isLink = !!teaser.href;
  const content = (
    <>
      <ProjectImage image={teaser.image} />
      <div className="flex flex-col flex-1 pt-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {teaser.context}
        </p>
        <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-medium tracking-tight mb-3">
          {teaser.title}
        </h3>
        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-5 flex-1">
          {teaser.blurb}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {teaser.chips.map((chip) => (
            <Badge
              key={chip}
              variant="secondary"
              className="h-6 text-xs font-normal px-2.5 bg-secondary text-foreground/75 border border-border/60"
            >
              {chip}
            </Badge>
          ))}
        </div>
        {isLink ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
            View project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/70 italic">
            Course project
          </span>
        )}
      </div>
    </>
  );

  const baseClasses =
    "group flex h-full flex-col rounded-lg border bg-card p-5 transition-all";

  if (isLink && teaser.href) {
    return (
      <Link
        href={teaser.href}
        className={`${baseClasses} border-border/60 hover:border-primary/40 hover:shadow-md`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`${baseClasses} border-border/40`}>{content}</div>
  );
}

export function ProjectTeasers() {
  return (
    <section
      id="projects"
      className="mx-auto max-w-5xl px-6 py-20 sm:py-24 border-t border-border/40"
    >
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight">
          <span className="text-muted-foreground/60 mr-3 text-sm uppercase tracking-[0.2em] font-sans">
            §
          </span>
          Selected projects
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {teasers.map((teaser) => (
          <Card key={teaser.title} teaser={teaser} />
        ))}
      </div>
    </section>
  );
}
