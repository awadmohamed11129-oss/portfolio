import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Teaser = {
  title: string;
  context: string;
  blurb: string;
  chips: string[];
  href?: string;
};

const teasers: Teaser[] = [
  {
    title: "PaveScan AI",
    context: "Independent project · 2026",
    blurb:
      "YOLO11 segmentation that scores pavement against the ASTM D6433 PCI standard, with a Streamlit dashboard, an interactive Folium GPS map, and a PDF report generator.",
    chips: ["YOLO11", "Python", "Streamlit", "Folium"],
    href: "/projects/pavescan-ai",
  },
  {
    title: "Pop-Up Chapel Co.",
    context: "Riipen consulting engagement · 60 hrs · Apr–May 2026",
    blurb:
      "Led the email-automation and document-generation workstream — a Python pipeline that renders eight branded wedding-day documents from one booking, plus a live Next.js companion tool deployed on Vercel.",
    chips: ["Python", "Pydantic", "Next.js", "TypeScript"],
    href: "/projects/pop-up-chapel",
  },
  {
    title: "Engineering Design Project",
    context: "TMU course project · Feb–Mar 2025",
    blurb:
      "Mobile storage cart for unhoused individuals plus a walking-cane prototype — designed for durability, weather resistance, and one-handed mobility.",
    chips: ["CAD", "Prototyping"],
  },
];

function Card({ teaser }: { teaser: Teaser }) {
  const isLink = !!teaser.href;
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
        {teaser.context}
      </p>
      <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-medium tracking-tight mb-3">
        {teaser.title}
      </h3>
      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-5">
        {teaser.blurb}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {teaser.chips.map((chip) => (
          <Badge
            key={chip}
            variant="secondary"
            className="h-6 text-xs font-normal px-2.5"
          >
            {chip}
          </Badge>
        ))}
      </div>
      {isLink ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
          View project
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground/70">
          Course project
        </span>
      )}
    </>
  );

  const baseClasses =
    "group flex h-full flex-col rounded-lg border bg-card/30 p-6 transition-colors";

  if (isLink && teaser.href) {
    return (
      <Link
        href={teaser.href}
        className={`${baseClasses} border-border/60 hover:border-foreground/40 hover:bg-card/50`}
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
      className="mx-auto max-w-5xl px-6 py-16 sm:py-20 border-t border-border/40"
    >
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight mb-8">
        Projects
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teasers.map((teaser) => (
          <Card key={teaser.title} teaser={teaser} />
        ))}
      </div>
    </section>
  );
}
