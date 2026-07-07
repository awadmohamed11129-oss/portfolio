import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Civic Data Pipeline",
  description:
    "Production ETL over Toronto open data: six City of Toronto mobility datasets engineered end to end, plus a signal engine over eight years of 311 service requests. 800+ tests passing.",
  twitter: {
    card: "summary_large_image",
    title: "Civic Data Pipeline — Mohamad Awad",
    description:
      "Production ETL over Toronto open data: six mobility ingestors plus a signal engine over eight years of 311 service requests. 800+ tests passing.",
  },
};

const techStack = [
  "Python 3.12",
  "PostgreSQL",
  "psycopg2",
  "pytest",
  "CKAN API (Toronto Open Data)",
  "stdlib csv + urllib",
  "black · flake8 · ruff",
];

const datasets = [
  {
    name: "Traffic Calming",
    note: "The dirty one. Numeric counts stored as strings, mixed-case district names, and sentinel text in data fields. Rows without a real install date were dropped instead of backfilled with fake timestamps, about 85% of them. Correctness over volume.",
  },
  {
    name: "Traffic Cameras",
    note: "Not events at all: no real timestamp. They became a reference table instead, with a regression test asserting cameras can never leak into the event stream.",
  },
  {
    name: "Traffic Volumes",
    note: "33 years of traffic-count sessions, 44,737 of them going back to 1993. A speed measure is emitted only where the survey actually measured speed, never a fake zero.",
  },
  {
    name: "Cycling Network",
    note: "Line geometry and install years for the city's bike infrastructure, with segment lengths derived in metres from the geometry.",
  },
  {
    name: "Bike Share Ridership",
    note: "Roughly 7 million trips a year, downloaded as zip archives and streamed row by row so the ingestor never holds a file in memory. Trips anchored to their origin station, with member type and bike model kept as dimensions.",
  },
  {
    name: "Road Restrictions",
    note: "A live JSON feed that emits invalid escape sequences. Parsed defensively, and only rows with real timestamps become events.",
  },
];

const qualityCalls = [
  {
    title: "Drop undated rows",
    body: "If a row has no real timestamp, it does not become an event. No backfilled dates, no fake history, even when that means dropping most of a dataset.",
  },
  {
    title: "Write None, not 0",
    body: "A measure gets emitted only where the source actually measured something. A camera with no view and a count session that never captured speed both write None, so nothing downstream mistakes absence for zero.",
  },
  {
    title: "Stable IDs from business fields",
    body: "Event IDs are UUIDv5 hashes of the fields that make a record what it is, not the portal's row numbers, which change between exports. Reruns produce the same IDs instead of duplicates.",
  },
  {
    title: "Sentinels are information",
    body: "In one dataset the string \"None\" means \"this camera has no view in that direction\". That is a fact, not missing data, and the pipeline preserves the difference.",
  },
];

export default function CivicDataPipelinePage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <section className="mb-16 sm:mb-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Work placement · May – Jul 2026
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
          Civic Data Pipeline
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Production ETL for a Toronto smart-city startup: six City of Toronto
          mobility datasets engineered end to end, plus a signal engine that
          turns eight years of Toronto 311 service requests into signals a
          non-technical reader can act on.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="https://open.toronto.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Browse the source data
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground max-w-2xl">
          Client work in a private repository under a confidentiality
          agreement. Everything on this page describes my own code and public
          datasets, at the level the agreement allows.
        </p>
        <div className="mt-12 rounded-lg border border-border/50 bg-card/30 p-4 sm:p-6 overflow-x-auto">
          <svg
            viewBox="0 0 1400 400"
            role="img"
            aria-labelledby="civic-pipeline-title civic-pipeline-desc"
            preserveAspectRatio="xMidYMid meet"
            className="w-full min-w-[700px] text-foreground"
            style={{
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            }}
          >
            <title id="civic-pipeline-title">Civic data pipeline</title>
            <desc id="civic-pipeline-desc">
              Toronto open datasets flow through pull and audit, then
              normalization into events and measures, then load into Postgres
              with contract tests. A separate branch takes eight years of 311
              data through a signal engine into JSON signal bundles with
              documented contracts, surfacing trends, hotspots, and early
              warnings.
            </desc>
            <defs>
              <marker
                id="civic-arrow"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
              </marker>
            </defs>
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="20" y="60" width="230" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="20" y="250" width="230" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="330" y="60" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="630" y="60" width="250" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
              <rect x="960" y="60" width="230" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="330" y="250" width="220" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
              <rect x="630" y="250" width="250" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="960" y="250" width="230" height="70" rx="8" strokeOpacity="0.55" />
            </g>
            <g fill="currentColor" fontSize="14" textAnchor="middle">
              <text x="135" y="89">Six mobility datasets</text>
              <text x="135" y="109" opacity="0.6">Toronto Open Data</text>
              <text x="440" y="99">Pull + audit</text>
              <text x="755" y="89" fontWeight="600">Normalize</text>
              <text x="755" y="109" opacity="0.6">events + measures</text>
              <text x="1075" y="89">Postgres</text>
              <text x="1075" y="109" opacity="0.6">contract tests</text>
              <text x="135" y="279">311 archive</text>
              <text x="135" y="299" opacity="0.6">8 years, ~500K rows/yr</text>
              <text x="440" y="289" fontWeight="600">Signal engine</text>
              <text x="755" y="279">JSON signal bundles</text>
              <text x="755" y="299" opacity="0.6">documented contracts</text>
              <text x="1075" y="279">Readable signals</text>
              <text x="1075" y="299" opacity="0.6">trends · hotspots · warnings</text>
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#civic-arrow)">
              <path d="M250 95 L330 95" />
              <path d="M550 95 L630 95" />
              <path d="M880 95 L960 95" />
              <path d="M250 285 L330 285" />
              <path d="M550 285 L630 285" />
              <path d="M880 285 L960 285" />
            </g>
          </svg>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The placement
        </h2>
        <div className="space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          <p>
            What the client builds, and how, is theirs; it stays behind the
            confidentiality agreement and off this page. My lane was
            Toronto&apos;s open mobility data, which is messy in every way
            real data is messy. The job was to normalize it into clean,
            well-typed events and measures. An event is what happened, where
            and when. A measure is how much, and in what unit.
          </p>
          <p>
            I was the newest person in a shared production codebase, so I
            worked carefully. Everything I wrote went through code review
            before it landed, and my changes to shared configuration only
            ever added lines. By the end of the placement I had written about
            9,400 lines across three pull requests.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Six datasets, six different kinds of messy
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-8">
          Every ingestor follows the same six-stage pattern: pull, audit,
          design doc, normalize, tests, documentation. Standard-library csv
          parsing, fully parameterized SQL, and a contract check on every
          event before it loads. Each dataset still needed its own judgment
          calls.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {datasets.map((d) => (
            <div
              key={d.name}
              className="rounded-lg border border-border/60 bg-card/30 p-5"
            >
              <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-medium tracking-tight mb-2">
                {d.name}
              </h3>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                {d.note}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          One structural decision came out of review: cameras carry no real
          timestamp, so forcing them into the event stream would have been a
          lie. I designed a reference-table pattern
          instead, and derived each camera&apos;s ward with a
          standard-library ray-casting point-in-polygon lookup against the
          city&apos;s 25-ward boundary file. Cross-validated against shapely
          with 100% agreement, and zero new dependencies added to the
          project.
        </p>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Data-quality calls I&apos;d defend in review
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {qualityCalls.map((q) => (
            <div
              key={q.title}
              className="rounded-lg border border-border/50 border-l-4 border-l-primary/60 bg-card/30 p-5"
            >
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {q.title}
              </h3>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                {q.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The signal engine
        </h2>
        <div className="space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          <p>
            Mid-placement I took on the biggest piece of my work: turn eight
            years of Toronto 311 service requests, about half a million rows
            a year from 2018 through 2025, into signals a non-technical
            audience can act on. I built it as a self-contained,
            standard-library-only engine: rising complaint categories against
            a multi-year baseline, drifting locations, repeat-complaint
            clusters, early-warning flags, and the top hotspot micro-areas
            with their growth and category breakdown. Three JSON bundles out,
            each with a written data contract for the engineer consuming
            them, and byte-identical output on every rerun.
          </p>
          <p>
            The part I&apos;m proudest of came from validating my own outputs
            against the raw public data, including a hotspot ranking whose
            order looks wrong until you check it. That validation surfaced
            two artifacts that would have skewed the story. A city division
            had been renamed across years, which fabricated a fake
            &quot;new&quot; complaint category; mapped historically, the true
            signal was a 10.6% rise. And a COVID-era gap of zero-count months
            was inflating one category&apos;s growth from a real 32% to a
            reported 85%. Both fixes shipped in the final bundles.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          By the numbers
        </h2>
        <div className="rounded-lg border border-border/50 border-l-4 border-l-primary/70 bg-card/40 p-6">
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">
                Datasets engineered
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-medium">
                7
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Lines across 3 PRs
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-medium">
                ~9,400
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tests passing</dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-medium">
                800+
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Rows of public data
              </dt>
              <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-medium">
                4M+
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-muted-foreground max-w-2xl">
            Every ingestor ships with its own walkthrough doc, source
            contract, committed sample, and contract-compliance tests, all
            black, flake8, and ruff clean.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Tech stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="h-7 text-sm font-normal px-3"
            >
              {t}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Where it stands
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          The placement wrapped in early July 2026, with everything I built
          delivered and handed off. What the client does with it from here is
          their story to tell, not mine. What I keep is the craft: seven
          public datasets engineered end to end, a signal engine I can defend
          line by line, and 800+ tests proving the work holds.
        </p>
      </section>

      <section className="border-t border-border/40 pt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to home
        </Link>
        <a
          href="https://open.toronto.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          Toronto Open Data
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </a>
      </section>
    </article>
  );
}
