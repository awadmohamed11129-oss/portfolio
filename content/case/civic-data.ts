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
    {
      kind: "diagram",
      heading: "Two ways to make the data useful",
      id: "civic-pipeline",
    },
    {
      kind: "prose",
      heading: "The placement",
      body: [
        "I worked on Toronto's public transport and traffic data. I built data importers, " +
          "also called ingestors, to turn inconsistent files into records with " +
          "consistent field types. The records separate events from measures: " +
          "an event says what happened, where and when; a measure says how much, " +
          "and in what unit. The hardest decisions were about what the source " +
          "data could honestly tell us.",
        "I was the newest person working in the shared production codebase, so " +
          "I kept my changes easy to review. Changes to shared settings only " +
          "added lines. By handoff I had submitted about " +
          `${f.lines.value} lines across three pull requests, which are code changes ` +
          "submitted for review. I cannot verify whether those changes were later merged or put into use.",
      ],
    },
    {
      kind: "list",
      heading: "The source data shaped the design",
      style: "cards",
      items: [
        {
          title: "Traffic calming",
          body: [
            "Counts arrived as text, district names used inconsistent " +
              "capitalization, and some fields contained special placeholder " +
              "values. I left out rows without a real installation date " +
              "rather than invent one. That meant dropping about 85 percent of the rows.",
          ],
        },
        {
          title: "Traffic cameras",
          body: [
            "Camera records have no real date or time, so I stored them in a " +
              "reference table instead of treating them as events. An automated " +
              "test checks that camera records never enter the event data.",
          ],
        },
        {
          title: "Traffic volumes",
          body: [
            `${f.trafficSessions.value} traffic-count sessions going back to ` +
              "1993. The output includes speed only when the survey measured " +
              "it. A missing measurement never becomes a speed of zero.",
          ],
        },
        {
          title: "Cycling network",
          body: [
            "Map lines and installation years describe the city's bike " +
              "infrastructure. I calculated section lengths in metres from " +
              "the mapped lines instead of relying on a supplied length column.",
          ],
        },
        {
          title: "Bike Share ridership",
          body: [
            `About ${f.bikeTrips.value} trips a year, delivered as zip archives ` +
              "and read one row at a time so a whole file never needs to fit " +
              "in memory. Each trip links to its starting station and keeps " +
              "its membership type and bike model for later comparisons.",
          ],
        },
        {
          title: "Road restrictions",
          body: [
            "A live JSON data feed sometimes contains incorrectly escaped " +
              "characters. The importer handles those formatting errors. " +
              "Only rows with real dates and times become events.",
          ],
        },
      ],
    },
    {
      kind: "prose",
      body: [
        "A review changed how I handled cameras. Without installation dates, " +
          "they belong in a reference table. I also worked out each camera's " +
          "ward by checking which boundary contains its map location, using " +
          `the city's ${f.wards.value} ward boundary file. I wrote this ` +
          "point-in-polygon check with Python's built-in tools. Its results " +
          "matched the Shapely mapping library on the comparison sample, " +
          "without adding a new software dependency.",
      ],
    },
    {
      kind: "list",
      heading: "Rules the software checks",
      style: "cards",
      items: [
        {
          title: "Drop undated rows",
          body: [
            "If a row has no real timestamp, it does not become an event. " +
              "The importer never invents a date, even when that means " +
              "leaving out most of a dataset.",
          ],
        },
        {
          title: "Keep missing measurements missing",
          body: [
            "The output includes a measurement only when the source measured " +
              "something. For a camera with no view in a direction, or a " +
              "traffic survey that never measured speed, the measure stays " +
              "empty (null). Later calculations cannot mistake it for zero.",
          ],
        },
        {
          title: "Keep the same record IDs on every run",
          body: [
            "A hash function turns the fields that identify an event into a " +
              "repeatable ID. The portal's row numbers can change between " +
              "downloads. Using the event fields keeps IDs stable and avoids " +
              "duplicate records when the importer runs again.",
          ],
        },
        {
          title: "Preserve what special values mean",
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
      heading: "Finding trends in 311 requests",
      body: [
        `The largest part of the work used ` +
          `${f.years311.value} of Toronto 311 service requests, roughly ` +
          `${f.rows311.value} rows a year from 2018 through 2025, to find ` +
          "patterns in residents' service requests. Using only Python's built-in " +
          "tools, I checked which complaint types were rising compared with " +
          "earlier years, where reports were shifting, and where complaints " +
          "kept recurring. The output includes early-warning flags and the " +
          "small areas with the strongest concentrations, broken down by " +
          "growth and complaint type. I delivered three JSON data bundles " +
          "with documented formats for the next engineer. Every rerun produces exactly the same files.",
        "Checking the results against the raw public data caught two mistakes " +
          "that would have told the wrong story. A city division changed its " +
          "name partway through the archive, making an existing complaint " +
          "category look new. After matching the old and new names, the real " +
          `increase was ${f.renameRise.value}. Pandemic-era months with zero ` +
          "counts also inflated one category's growth from " +
          `${f.covidReal.value} to ${f.covidReported.value}. I corrected both ` +
          "problems in the final data bundles.",
      ],
    },
    {
      kind: "stat",
      heading: "Scale at handoff",
      items: [
        { label: "Transport data importers", fact: f.datasets, note: "plus a separate tool to analyse the 311 archive" },
        { label: "Lines across 3 code submissions", fact: f.lines },
        { label: "Rows of public data", fact: f.rows },
      ],
      note:
        "Each importer came with documentation, a description of the expected source format, " +
        "sample data and tests that check those expectations. These figures describe what I handed over, not a current live system.",
    },
    {
      kind: "callout",
      heading: "What a rise in complaints tells us",
      tone: "limitation",
      body: [
        "More recorded complaints do not necessarily mean conditions got worse, or tell us why. Category names, missing months and changes in how people report problems all affect the figures. The output shows the comparison period and calculation so a reader can check the trend.",
        "The public case study covers my contribution and publicly available source data. It omits client identifiers and private implementation details.",
      ],
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
        "The placement ended in early July 2026. I submitted the importers for " +
          "review and handed over the trend data and documentation. " +
          "I cannot verify a later rollout or any business results from that work.",
      ],
    },
  ],
};
