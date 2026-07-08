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
          I&apos;m a civil engineering student at Toronto Metropolitan
          University. Most infrastructure inspection still gets done by hand,
          so I build tools that put computer vision and automation behind the
          standards inspectors already use.
        </p>
        <p>
          <Link
            href="/projects/pavescan-ai"
            className="underline decoration-border underline-offset-4 hover:decoration-primary transition-colors"
          >
            PaveScan AI
          </Link>{" "}
          is my main project. It&apos;s a YOLO11 segmentation model that
          reads pavement images and scores them against the ASTM D6433
          Pavement Condition Index, with a Streamlit dashboard and a sample
          PDF report.
        </p>
        <p>
          This summer I finished a data engineering placement with a Toronto
          smart-city startup, where I{" "}
          <Link
            href="/projects/civic-data-pipeline"
            className="underline decoration-border underline-offset-4 hover:decoration-primary transition-colors"
          >
            built production ETL ingestors
          </Link>{" "}
          for six City of Toronto mobility datasets and a signal engine over
          eight years of 311 service-request data. That work shipped with
          800+ passing tests.
        </p>
        <p>
          I also led the email-automation and document-generation workstream
          on a{" "}
          <Link
            href="/projects/pop-up-chapel"
            className="underline decoration-border underline-offset-4 hover:decoration-primary transition-colors"
          >
            60-hour Riipen consulting project
          </Link>{" "}
          for a Canadian micro-wedding company. The work shipped as a Python
          pipeline that turns one booking into eight branded wedding-day
          documents, plus a live Next.js companion tool on Vercel.
        </p>
        <p>
          The common thread: work that used to take hours of manual effort
          now runs in seconds. That&apos;s what I want to bring to a civil
          engineering co-op.
        </p>
      </div>
    </section>
  );
}
