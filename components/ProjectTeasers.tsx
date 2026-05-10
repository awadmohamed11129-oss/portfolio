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
      src: "/images/pavescan/val_batch0_pred.jpg",
      alt: "Grid of pavement images with YOLO11 crack-segmentation overlays",
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
      <div className="aspect-[16/10] w-full rounded-md bg-gradient-to-br from-secondary to-accent flex items-center justify-center border border-border/40">
        <span className="font-[family-name:var(--font-fraunces)] italic text-4xl text-primary/50">
          ED
        </span>
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teasers.map((teaser) => (
          <Card key={teaser.title} teaser={teaser} />
        ))}
      </div>
    </section>
  );
}
