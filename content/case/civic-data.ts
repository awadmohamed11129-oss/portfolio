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
    "Production ETL for a Toronto smart-city startup: six City of Toronto " +
    "mobility datasets engineered end to end, plus a signal engine that turns " +
    `${f.years311.value} of 311 service requests into something a non-technical ` +
    "reader can act on.",
  metaDescription:
    "Production ETL over Toronto open data: six mobility ingestors and a " +
    `signal engine across ${f.years311.value} of 311 service requests. ` +
    `${f.rows.value} rows, ${f.tests.value} tests passing.`,
  links: [
    { label: "Browse the source data", href: DIRECT.torontoOpenData, icon: "external" },
  ],
  linkNote:
    "Client work in a private repository under a confidentiality agreement. " +
    "This page describes my own code and public datasets, at the level the " +
    "agreement allows.",
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
    {
      kind: "diagram",
      heading: "Two pipelines, one codebase",
      id: "civic-pipeline",
    },
    {
      kind: "prose",
      heading: "The placement",
      body: [
        "My lane was Toronto's open mobility data, which is messy in every way " +
          "real data is messy. The job was to turn it into clean, well-typed " +
          "events and measures. An event is what happened, where and when. A " +
          "measure is how much, and in what unit. Most of the difficulty was " +
          "not writing the parser. It was deciding what the pipeline should " +
          "refuse to say.",
        "I was the newest person in a shared production codebase, so I worked " +
          "in a way that made me easy to review. Everything went through review " +
          "before it landed, and my changes to shared configuration only ever " +
          `added lines. By the end I had written about ${f.lines.value} lines ` +
          "across three pull requests.",
      ],
    },
    {
      kind: "list",
      heading: "Six datasets, six kinds of messy",
      style: "cards",
      items: [
        {
          title: "Traffic Calming",
          body: [
            "The dirty one. Counts stored as strings, district names in mixed " +
              "case, and sentinel text sitting in data fields. Rows without a " +
              "real install date were dropped rather than backfilled with " +
              "invented timestamps, which meant dropping about 85 percent of " +
              "them.",
          ],
        },
        {
          title: "Traffic Cameras",
          body: [
            "Not events at all, because they carry no real timestamp. They " +
              "became a reference table instead, with a regression test " +
              "asserting a camera can never leak into the event stream.",
          ],
        },
        {
          title: "Traffic Volumes",
          body: [
            `${f.trafficSessions.value} traffic-count sessions going back to ` +
              "1993. A speed measure is emitted only where the survey actually " +
              "measured speed, never as a zero standing in for silence.",
          ],
        },
        {
          title: "Cycling Network",
          body: [
            "Line geometry and install years for the city's bike " +
              "infrastructure, with segment lengths derived in metres from the " +
              "geometry rather than trusted from a column.",
          ],
        },
        {
          title: "Bike Share Ridership",
          body: [
            `About ${f.bikeTrips.value} trips a year, delivered as zip archives ` +
              "and streamed row by row so the ingestor never holds a file in " +
              "memory. Trips anchor to their origin station, with member type " +
              "and bike model kept as dimensions.",
          ],
        },
        {
          title: "Road Restrictions",
          body: [
            "A live JSON feed that emits invalid escape sequences. Parsed " +
              "defensively, and only rows carrying real timestamps become " +
              "events.",
          ],
        },
      ],
    },
    {
      kind: "prose",
      body: [
        "One structural decision came out of review. Cameras have no timestamp, " +
          "so forcing them into the event stream would have been a lie told in " +
          "SQL. I built a reference-table pattern instead, and derived each " +
          "camera's ward with a point-in-polygon lookup against the city's " +
          `${f.wards.value} ward boundary file, written with the standard ` +
          "library. Cross-checked against shapely at full agreement, and it " +
          "added no new dependency to the project.",
      ],
    },
    {
      kind: "list",
      heading: "Data-quality calls I would defend in review",
      style: "cards",
      items: [
        {
          title: "Drop undated rows",
          body: [
            "If a row has no real timestamp, it does not become an event. No " +
              "backfilled dates and no invented history, even when that means " +
              "dropping most of a dataset.",
          ],
        },
        {
          title: "Write nothing, not zero",
          body: [
            "A measure is emitted only where the source actually measured " +
              "something. A camera with no view in a direction and a count " +
              "session that never recorded speed both write null, so nothing " +
              "downstream can mistake absence for a reading of zero.",
          ],
        },
        {
          title: "Stable IDs from real fields",
          body: [
            "Event IDs are hashes of the fields that make a record what it is, " +
              "not the portal's row numbers, which change between exports. " +
              "Rerunning produces the same IDs instead of a second copy of " +
              "everything.",
          ],
        },
        {
          title: "Sentinels carry meaning",
          body: [
            "In one dataset the string \"None\" means the camera has no view in " +
              "that direction. That is a fact about the camera, not a missing " +
              "value, and the pipeline preserves the difference.",
          ],
        },
      ],
    },
    {
      kind: "prose",
      heading: "The signal engine",
      body: [
        `Mid-placement I took on the largest piece of the work: turning ` +
          `${f.years311.value} of Toronto 311 service requests, roughly ` +
          `${f.rows311.value} rows a year from 2018 through 2025, into signals a ` +
          "non-technical audience can act on. I wrote it as a self-contained " +
          "engine using only the standard library: complaint categories rising " +
          "against a multi-year baseline, drifting locations, repeat-complaint " +
          "clusters, early-warning flags, and the top hotspot micro-areas with " +
          "their growth and category breakdown. Three JSON bundles out, each " +
          "with a written contract for the engineer consuming it, and " +
          "byte-identical output on every rerun.",
        "The part I am proudest of came from checking my own output against the " +
          "raw public data instead of trusting it. That caught two artifacts " +
          "that would have shipped a false story. A city division had been " +
          "renamed partway through the archive, which fabricated a brand new " +
          "complaint category out of nothing; mapped historically, the real " +
          `signal was a ${f.renameRise.value} rise. And a run of pandemic-era ` +
          "months with zero counts was inflating one category's growth from a " +
          `real ${f.covidReal.value} to a reported ${f.covidReported.value}. Both ` +
          "fixes shipped in the final bundles.",
      ],
    },
    {
      kind: "stat",
      heading: "By the numbers",
      items: [
        { label: "Datasets engineered", fact: f.datasets, note: "six mobility, plus the 311 archive" },
        { label: "Lines across 3 PRs", fact: f.lines },
        { label: "Tests passing", fact: f.tests },
        { label: "Rows of public data", fact: f.rows },
      ],
      note:
        "Every ingestor shipped with a walkthrough doc, a source contract, a " +
        "committed sample, and contract-compliance tests, all lint clean.",
    },
    {
      kind: "quote",
      heading: "The review that came back",
      text:
        "He demonstrated strong initiative and self-direction. Mohamad " +
        "consistently took ownership of his tasks without needing excessive " +
        "guidance. This is a rare trait in student contributors and extremely " +
        "valuable in a startup context.",
      attribution:
        `Founder and CEO of the client company, in the placement's final ` +
        `review. Rated ${f.rating.value} across every category.`,
    },
    {
      kind: "prose",
      heading: "Where it stands",
      body: [
        "The placement wrapped in early July 2026 with everything I built " +
          "delivered and handed off. What the client does with it from here is " +
          "their story to tell, not mine.",
      ],
    },
  ],
};
