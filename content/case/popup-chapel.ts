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
    `One booking produces ${f.docs.value} branded wedding-day documents. ` +
    `I led the email and document work in this ${f.hours.value} hour Riipen ` +
    "project for a Canadian small-wedding company, including a web tool for the owner.",
  metaDescription:
    `A ${f.hours.value} hour consulting project for a Canadian micro-wedding ` +
    `company. A Python pipeline that turns one booking into ${f.docs.value} ` +
    "branded wedding-day documents, plus a Next.js companion tool.",
  links: [
    { label: "Open the companion tool", href: DIRECT.chapelTool, icon: "external" },
    {
      label: "Download a sample document",
      href: "/pdfs/popup-chapel-couples-info.pdf",
      icon: "download",
    },
  ],
  linkNote: "The companion tool and sample documents illustrate the 2026 engagement. The intake workflow and account-ownership handoff were not completed.",
  overview: [
    { label: "My role", value: "Led email communication and document generation in a three-student team" },
    { label: "Built", value: "Python document generator and Next.js companion tool" },
    { label: "Status", value: "Document generation delivered; booking intake and live access controls unfinished" },
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
      heading: "My part in the project",
      body: [
        `Pop-Up Chapel Co. runs small weddings across ${f.cities.value} Canadian ` +
          `cities. Through Riipen, a team of ${f.team.value} students took on a ` +
          `${f.hours.value} hour project to map how the company communicates with ` +
          "its couples and build a prototype to generate documents. I led the " +
          "email and document work. My two " +
          "teammates covered the platform design and handling new enquiries. April 3 to " +
          "May 8, 2026.",
      ],
    },
    {
      kind: "prose",
      heading: "The problem",
      body: [
        `The project estimate was roughly ${f.manualHours.value} of manual document ` +
          "work. Names, dates, package details and vendor assignments were " +
          "copied by hand into four separate templates, and the wording came " +
          "out slightly different every time. The owner wanted one booking to " +
          "produce every document for the day, in the company's own voice, " +
          "with less repeated editing before the documents could be reviewed.",
      ],
    },
    {
      kind: "prose",
      heading: "How a booking becomes documents",
      body: [
        "A command-line tool reads one booking from a JSON data file. Pydantic " +
          "checks the booking fields, then the tool generates the wording " +
          "that varies between weddings. Jinja2 fills the company's branded " +
          `templates, and an automated browser prints ${f.docs.value} documents ` +
          `using Playwright. About ` +
          `${f.runtime.value} per booking.`,
        "The booking fields match the Postgres database columns my teammate " +
          "was designing. That would let the database pass a booking to the " +
          "generator without translating its format. The web tool uses the " +
          "same document structure and branding to keep the set consistent.",
        "A language model writes the variable wording. If that service is " +
          "unavailable, fixed wording takes over and the tool still produces " +
          "the full document set, because a wedding " +
          "on Saturday is not a good time to discover that an API key expired.",
      ],
    },
    {
      kind: "diagram",
      heading: "One booking to eight documents",
      id: "chapel-pipeline",
      note:
        "The part I built. Database design, directing new enquiries and billing " +
        "belonged to other people on the same engagement.",
    },
    {
      kind: "prose",
      heading: "The companion tool",
      body: [
        "The owner needed to use it in a browser. The second half is a small Next.js " +
          "app on Vercel that reads bookings from a Google Sheet and rebuilds " +
          `any booking's documents in the browser, about ${f.webRuntime.value} ` +
          `per run, ${f.zipFiles.value} files in the download. The app checks ` +
          "booking fields before using them. Service credentials stay in the " +
          "server's settings. That does not replace the unfinished access controls below.",
      ],
    },
    {
      kind: "callout",
      heading: "What was delivered and what remains unfinished",
      tone: "limitation",
      body: [
        "I wrote and tested cookie-based sign-in checks and limits on how " +
          "often someone could call the tool, but never enabled them on the " +
          "live site. The booking form only reached a step-by-step layout " +
          "with no working fields. The project's " +
          `${f.hours.value} hours ran out first, and taking a booking still ` +
          "means someone typing it into the Google Sheet.",
        "I delivered the document generator and put the companion tool online " +
          "during the project. Transferring account ownership and handing over " +
          "operation of the tool were not completed. It remains a prototype and companion tool, " +
          "not a completed booking platform.",
      ],
    },
    {
      kind: "prose",
      heading: "The messages the company was missing",
      body: [
        `I mapped ${f.touchpointsAudited.value} points of contact with couples ` +
          "throughout a booking. The owner called the gaps the most useful " +
          `finding: ${f.missing.value} messages the ` +
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
