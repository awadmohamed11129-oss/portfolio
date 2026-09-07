import type { CaseStudy } from "../types";
import { civic as f } from "../facts";
import { DIRECT } from "../links";

/**
 * Civic Data Pipeline.
 *
 * Client work under a confidentiality agreement. What the client builds and how
 * they build it stays off this page. Everything here describes Mohamad's own
 * code against public City of Toronto datasets.
 *
 * The "if a row has no real timestamp, it does not become an event" principle is
 * the load-bearing idea of this page and survives every rewrite. So does the
 * attributed review. Do not soften either.
 */
export const civicDataCase: CaseStudy = {
  slug: "civic-data-pipeline",
  title: "Civic Data Pipeline",
  eyebrow: "Work placement, May to July 2026",
  summary:
    "I built tools to clean six Toronto transport datasets and find trends in " +
    `${f.years311.value} of 311 service requests for a Toronto smart-city startup.`,
  metaDescription:
    "Tools to collect and clean Toronto open data: six transport datasets and " +
    `trend analysis across ${f.years311.value} of 311 service requests. ` +
    `${f.rows.value} rows of public data processed during the placement.`,
  links: [
    { label: "Browse the source data", href: DIRECT.torontoOpenData, icon: "external" },
  ],
  linkNote:
    "The client code is private under a confidentiality agreement. " +
    "This page covers my own work with public data and leaves out private client details.",
  overview: [
    { label: "My contribution", value: "Data collection and cleanup, quality checks, and 311 trend analysis" },
    { label: "Delivered", value: "Three sets of code changes submitted for review, documented outputs and handoff material" },
    { label: "Scope", value: "My own work with public data; client implementation stays private" },
  ],
  stack: [
    {
      label: "Stack",
      items: [
        "Python 3.12",
        "PostgreSQL",
        "psycopg2",
        "pytest",
        "CKAN API",
        "stdlib csv and urllib",
        "black, flake8, ruff",
      ],
    },
  ],
  blocks: [
    { kind: "prose", heading: "What I built", body: [
      "Toronto's public datasets arrive in different formats, with missing dates and inconsistent values. I built import tools that turn them into consistent records, plus a separate tool to find patterns in residents' 311 requests.",
      "The transport data covers traffic calming, cameras, traffic counts, cycling routes, Bike Share trips and road restrictions. Each importer came with sample data, documentation and automated checks.",
    ] },
    { kind: "diagram", heading: "From public data to useful records", id: "civic-pipeline" },
    { kind: "list", heading: "Making the data trustworthy", style: "cards", items: [
      { title: "Use real dates", body: ["If a row has no real timestamp, it does not become an event. Camera locations stay in a reference table; undated traffic-calming records are left out."] },
      { title: "Keep missing values missing", body: ["An unmeasured speed is not zero. I kept that distinction and used repeatable record IDs to prevent duplicates on later runs."] },
      { title: "Handle large files", body: [`Bike Share has about ${f.bikeTrips.value} trips a year. Reading one row at a time lets the importer handle files too large to load into memory at once.`] },
    ] },
    { kind: "prose", heading: "Catching misleading trends", body: [
      `The 311 tool checks ${f.years311.value} of requests for rising complaint types and recurring trouble spots. Checking the source records caught two misleading results.`,
      `A renamed city division made an existing category look new. Matching its old and new names showed the actual increase: ${f.renameRise.value}. Missing pandemic-era counts also inflated another trend from ${f.covidReal.value} to ${f.covidReported.value}. I corrected both before handoff.`,
    ] },
    { kind: "stat", heading: "Scale at handoff", items: [
      { label: "Transport data importers", fact: f.datasets, note: "Plus a separate 311 analysis tool" },
      { label: "Lines across 3 code submissions", fact: f.lines },
      { label: "Rows of public data", fact: f.rows },
    ], note: "These figures describe the work handed over, not a current live system." },
    { kind: "callout", heading: "What the results can tell us", tone: "limitation", body: [
      "More complaints do not automatically mean worse conditions. Missing records and changes in how people report problems affect the trends. Each result includes its comparison period and calculation.",
      "The placement ended in July 2026. I handed over the code, data and documentation; I cannot verify a later rollout or business results.",
    ] },
    { kind: "quote", heading: "What the client said", text:
      "He demonstrated strong initiative and self-direction. Mohamad " +
      "consistently took ownership of his tasks without needing excessive " +
      "guidance. This is a rare trait in student contributors and extremely " +
      "valuable in a startup context.",
      attribution: `Founder and CEO of the client company, in the placement's final review. Rated ${f.rating.value} across every category.`,
    },
  ],
};
