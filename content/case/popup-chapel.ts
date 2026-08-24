import type { CaseStudy } from "../types";
import { chapel as f } from "../facts";
import { DIRECT } from "../links";

/**
 * Pop-Up Chapel Co.
 *
 * The attributed CEO quote and the 5.0/5 rating survive every rewrite, and so
 * does the admission that auth, rate limiting, and the intake form were built
 * but never switched on. That admission is why the rest of the page is
 * believable. Do not quietly upgrade "written and tested" into "shipped".
 *
 * Scope discipline: Mohamad led one workstream of a three-person engagement.
 * Every claim here is about his own workstream.
 */
export const popupChapelCase: CaseStudy = {
  slug: "pop-up-chapel",
  title: "Pop-Up Chapel Co.",
  eyebrow: "Consulting engagement, April to May 2026",
  summary:
    `A ${f.hours.value} hour Riipen consulting project for a Canadian ` +
    "micro-wedding company. I led the email and document-generation " +
    `workstream: one booking goes in, ${f.docs.value} branded day-of documents ` +
    "come out, plus a companion web tool the owner can run herself.",
  metaDescription:
    `A ${f.hours.value} hour consulting project for a Canadian micro-wedding ` +
    `company. A Python pipeline that turns one booking into ${f.docs.value} ` +
    "branded wedding-day documents, plus a live Next.js companion tool.",
  links: [
    { label: "Open the live tool", href: DIRECT.chapelTool, icon: "external" },
    {
      label: "Download a sample document",
      href: "/pdfs/popup-chapel-couples-info.pdf",
      icon: "download",
    },
  ],
  hero: {
    src: "/images/popup-chapel/live-site-home.png",
    alt: "Home view of the Pop-Up Chapel companion tool, showing the booking-driven day-of document generator",
    width: 1425,
    height: 944,
    caption:
      "The companion tool. It reads bookings from a Google Sheet and rebuilds " +
      "the document set in the browser.",
  },
  stack: [
    {
      label: "Python pipeline",
      items: ["Python 3.10", "Pydantic", "Jinja2", "Playwright", "Anthropic SDK", "ReportLab"],
    },
    {
      label: "Companion tool",
      items: ["Next.js", "TypeScript", "Tailwind CSS", "Zod", "Google Sheets API", "Vercel"],
    },
  ],
  blocks: [
    {
      kind: "prose",
      heading: "The engagement",
      body: [
        `Pop-Up Chapel Co. runs small weddings across ${f.cities.value} Canadian ` +
          `cities. Through Riipen, a team of ${f.team.value} students took on a ` +
          `${f.hours.value} hour project to map how the company communicates with ` +
          "its couples and prototype the automation that would save the most " +
          "time. I led the email and document-generation workstream. My two " +
          "teammates covered platform architecture and lead intake. April 3 to " +
          `May 8, 2026, on a ${f.stipend.value} stipend. This was student ` +
          "consulting work and I would not describe it as anything else.",
      ],
    },
    {
      kind: "prose",
      heading: "The problem",
      body: [
        `Every booking cost roughly ${f.manualHours.value} of manual document ` +
          "work. Names, dates, package details and vendor assignments were " +
          "copied by hand into four separate templates, and the wording came " +
          "out slightly different every time. The owner wanted one booking to " +
          "produce every document for the day, in the company's own voice, " +
          "without her having to proofread each one before it went out.",
      ],
    },
    {
      kind: "prose",
      heading: "The pipeline",
      body: [
        "A command-line tool takes one booking as JSON, validates it against " +
          "Pydantic schemas, generates the copy that varies between weddings, " +
          "renders Jinja2 templates against the company's brand stylesheet, and " +
          `prints ${f.docs.value} documents through headless Playwright. About ` +
          `${f.runtime.value} per booking.`,
        "The schema layer maps one to one onto the Postgres columns the " +
          "platform workstream was designing, so their database and my " +
          "generator would not need a translation layer between them when the " +
          "two halves met. The templates and stylesheet are shared with the web " +
          "tool, which is what keeps the two outputs from drifting apart.",
        "Copy generation calls a language model, but never depends on it. If " +
          "the API is unavailable the pipeline falls back to deterministic " +
          "wording and still produces the full document set, because a wedding " +
          "on Saturday is not a good time to discover that an API key expired.",
      ],
    },
    {
      kind: "diagram",
      heading: "One booking to eight documents",
      id: "chapel-pipeline",
      note:
        "The workstream I built. Database design, lead routing and billing " +
        "belonged to other people on the same engagement.",
    },
    {
      kind: "prose",
      heading: "The companion tool",
      body: [
        "The command line is fine for me and useless for the person who " +
          "actually runs the business. So the second half is a small Next.js " +
          "app on Vercel that reads bookings from a Google Sheet and rebuilds " +
          `any booking's documents in the browser, about ${f.webRuntime.value} ` +
          `per run, ${f.zipFiles.value} files in the archive. Inputs are ` +
          "validated on the way in, and every secret stays in server-side " +
          "environment variables.",
      ],
    },
    {
      kind: "callout",
      heading: "What shipped and what did not",
      tone: "limitation",
      body: [
        "Cookie authentication and rate limiting were written and tested, and " +
          "never switched on in production. An intake form got as far as a " +
          "wizard shell with no live fields. The engagement's " +
          `${f.hours.value} hours ran out first, and taking a booking still ` +
          "means someone typing it into the Google Sheet.",
        "I would rather say that plainly than describe the tool as finished. " +
          "The document generation is genuinely in use. The parts around it " +
          "are a prototype that stopped when the clock did.",
      ],
    },
    {
      kind: "prose",
      heading: "The finding they kept",
      body: [
        `The communication audit mapped ${f.touchpointsAudited.value} touchpoints ` +
          "across the booking lifecycle. The part the owner called most useful " +
          `was not any of those. It was the ${f.missing.value} touchpoints the ` +
          "company was not sending at all: no booking confirmation separate " +
          "from the upsell, no morning-of message with the coordinator's phone " +
          "number, no request for a referral after the event. Finding the gaps " +
          "turned out to be worth more than automating what already existed.",
      ],
    },
    {
      kind: "quote",
      heading: "What the client said",
      text:
        "Working with Mohamad was a great experience. Throughout the project, " +
        "he consistently demonstrated professionalism, strong communication " +
        "skills, and a thoughtful approach to collaboration.",
      attribution:
        "Alicia Thurston, CEO, The Pop-Up Chapel Co. Rated " +
        `${f.rating.value} in the project's final review.`,
    },
  ],
};
