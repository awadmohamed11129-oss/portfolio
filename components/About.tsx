import Link from "next/link";

export function About() {
  return (
    <section
      id="about"
      className="mx-auto max-w-5xl px-6 py-16 sm:py-20 border-t border-border/40"
    >
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight mb-8">
        About
      </h2>
      <div className="max-w-2xl space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90">
        <p>
          I&apos;m a second-year civil engineering student at Toronto
          Metropolitan University, focused on infrastructure inspection — how
          pavements, bridges, and buildings get surveyed, scored, and
          maintained. The field still does a lot of that work by hand, so I
          build tools that combine civil-engineering standards with computer
          vision and automation.
        </p>
        <p>
          <Link
            href="/projects/pavescan-ai"
            className="underline decoration-border underline-offset-4 hover:decoration-foreground transition-colors"
          >
            PaveScan AI
          </Link>{" "}
          is my main project: a YOLO11 segmentation model that reads pavement
          imagery and scores it against the ASTM D6433 Pavement Condition
          Index standard, with a Streamlit dashboard and a sample PDF report.
        </p>
        <p>
          I also led the email-automation and document-generation workstream
          of a{" "}
          <Link
            href="/projects/pop-up-chapel"
            className="underline decoration-border underline-offset-4 hover:decoration-foreground transition-colors"
          >
            60-hour Riipen consulting engagement
          </Link>{" "}
          for a Canadian micro-wedding business — a Python pipeline that
          auto-generates eight branded wedding-day documents from a single
          booking, plus a live Next.js companion tool on Vercel.
        </p>
        <p>
          I&apos;m looking for civil engineering co-op placements where
          automation depth is an asset, not a side project.
        </p>
      </div>
    </section>
  );
}
