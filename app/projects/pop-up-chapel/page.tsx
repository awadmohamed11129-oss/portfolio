/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pop-Up Chapel Co.",
  description:
    "60-hour Riipen consulting project for a Canadian micro-wedding company. Led the email-automation and document-generation workstream: a Python pipeline that turns one booking into eight branded wedding-day PDFs, plus a live Next.js companion tool on Vercel.",
};

const pythonStack = [
  "Python 3.10",
  "Pydantic",
  "Jinja2",
  "Playwright",
  "Anthropic SDK",
  "ReportLab",
];

const nextStack = [
  "Next.js 14",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Zod",
  "Google Sheets API",
  "react-pdf",
  "Vercel",
];

const sampleDocs = [
  {
    title: "Couples Information Sheet",
    blurb:
      "Single-page overview of the day handed to the couple — venue, timing, vendor contacts, and the run of show.",
    href: "/pdfs/popup-chapel-couples-info.pdf",
  },
  {
    title: "Vendor Run Sheet",
    blurb:
      "Minute-by-minute schedule the photographer, officiant, florist, and venue staff work from on the day.",
    href: "/pdfs/popup-chapel-vendor-run-sheet.pdf",
  },
  {
    title: "Packing List",
    blurb:
      "What the couple, the wedding party, and the day-of coordinator each need to bring, broken out by role.",
    href: "/pdfs/popup-chapel-packing-list.pdf",
  },
  {
    title: "Posting Guide",
    blurb:
      "Sharing copy and tagging instructions sent after the event so the couple's posts read in the brand voice.",
    href: "/pdfs/popup-chapel-posting-guide.pdf",
  },
];

const missingTouchpoints = [
  { id: "A1", label: "Post-inquiry nurture sequence for leads who don't immediately book" },
  { id: "A2", label: "Booking confirmation email separate from any upsell" },
  { id: "A3", label: "60-day and 30-day mid-planning check-ins" },
  { id: "A4", label: "Morning-of email with coordinator contact and day-of details" },
  { id: "A5", label: "Structured post-event referral ask" },
  { id: "A6", label: "Photo-delivery timeline email that sets expectations" },
  { id: "A7", label: "One-year anniversary touchpoint" },
  { id: "A8", label: "Vendor introduction email" },
  { id: "A9", label: "Date-change protocols" },
];

const LIVE_TOOL_URL = "https://popup-chapel-docs.vercel.app";

export default function PopUpChapelPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <section className="mb-16 sm:mb-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Consulting engagement · April–May 2026
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
          Pop-Up Chapel Co.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A 60-hour Riipen consulting project for a Canadian micro-wedding
          company. I led the email-automation and document-generation
          workstream: a Python pipeline that turns one booking into eight
          branded wedding-day PDFs, plus a live Next.js companion tool on
          Vercel.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href={LIVE_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            View live tool
          </a>
          <a
            href="/pdfs/popup-chapel-couples-info.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download a sample doc
          </a>
        </div>
        <figure className="mt-12">
          <img
            src="/images/popup-chapel/live-site-home.png"
            alt="The Pop-Up Chapel companion tool on Vercel — home view of the booking-driven day-of document generator"
            className="w-full rounded-lg border border-border/50"
          />
          <figcaption className="mt-3 text-sm text-muted-foreground">
            The live companion tool on Vercel — Google Sheets API with
            HMAC-signed cookie auth and Zod validation on every endpoint.
          </figcaption>
        </figure>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The engagement
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Pop-Up Chapel Co. is a Canadian micro-wedding company operating
          across six cities. Through Riipen, a three-person student team took
          on a 60-hour consulting project to map the company&apos;s
          communication systems and prototype the automations that would save
          the most time. I led the email-automation and document-generation
          workstream. Another teammate handled the underlying database and
          platform architecture, and a third handled lead routing and intake.
          April 3 – May 8, 2026, on a $1,400 stipend through the program —
          student consulting work, not senior agency work.
        </p>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The problem
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Each booking required roughly eight hours of manual document work:
          copy-pasting names, dates, package details, and vendor assignments
          into four separate templates, with the wording coming out a bit
          different each time. The CEO needed something that could take one
          booking and generate every day-of document from it, in the brand
          voice, without proofreading every email.
        </p>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What I built — Python prototype
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-5">
          A command-line pipeline that takes one booking JSON, validates it
          against Pydantic schemas, generates AI copy (with a deterministic
          fallback if the API is unavailable), renders Jinja2 templates
          against the brand stylesheet, and ships eight branded day-of PDFs
          through headless Playwright. About ten seconds per booking.
        </p>
        <ul className="space-y-3 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl list-disc pl-6 marker:text-muted-foreground">
          <li>
            Pydantic schema layer that maps one-to-one to the future Postgres
            columns the platform team is designing — same field names, same
            constraints, no translation layer when it lands.
          </li>
          <li>
            Anthropic SDK integration with prompt caching and a deterministic
            fallback path, so the CLI still ships documents when the API
            isn&apos;t available.
          </li>
          <li>
            Jinja2 templates plus the brand stylesheet (Inter and Fraunces,
            Pop-Up Chapel pink) shared with the live web tool, so HTML and
            PDF output never drift.
          </li>
          <li>
            Headless Playwright render that turns each Jinja2 page into a
            print-quality PDF — eight documents per booking from one JSON
            input.
          </li>
        </ul>
        <div className="mt-8 rounded-lg border border-border/50 bg-card/30 p-4 sm:p-6 overflow-x-auto">
          <svg
            viewBox="0 0 1400 320"
            role="img"
            aria-labelledby="popup-pipeline-title popup-pipeline-desc"
            preserveAspectRatio="xMidYMid meet"
            className="w-full min-w-[700px] text-foreground"
            style={{
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            }}
          >
            <title id="popup-pipeline-title">
              Pop-Up Chapel document-generation pipeline
            </title>
            <desc id="popup-pipeline-desc">
              A booking JSON feeds Pydantic schemas, which hand off to Jinja2
              templates. The Anthropic SDK provides AI-generated copy as a
              side input feeding Jinja2. The rendered HTML is converted to
              PDF by headless Playwright, producing eight branded day-of
              documents in about ten seconds.
            </desc>
            <defs>
              <marker
                id="popup-pipeline-arrow"
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
              <rect x="40" y="180" width="180" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="260" y="180" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="520" y="180" width="200" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="520" y="40" width="200" height="70" rx="8" strokeOpacity="0.45" strokeDasharray="4 3" />
              <rect x="760" y="180" width="200" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="1000" y="180" width="240" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
            </g>
            <g fill="currentColor" fontSize="14" textAnchor="middle">
              <text x="130" y="219">Booking JSON</text>
              <text x="370" y="219">Pydantic schemas</text>
              <text x="620" y="219">Jinja2 templates</text>
              <text x="620" y="79">Anthropic SDK (AI copy)</text>
              <text x="860" y="219">Playwright render</text>
              <text x="1120" y="219" fontWeight="600">8 day-of PDFs · ~10s</text>
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#popup-pipeline-arrow)">
              <path d="M220 215 L260 215" />
              <path d="M480 215 L520 215" />
              <path d="M720 215 L760 215" />
              <path d="M960 215 L1000 215" />
              <path d="M620 110 L620 180" />
            </g>
          </svg>
          <p className="mt-4 text-sm text-muted-foreground max-w-3xl">
            The pipeline I personally built. The broader platform
            architecture — database design, lead routing, billing — sat
            with other workstreams on the same engagement.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What I built — live Next.js companion tool
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-5">
          A Next.js companion on Vercel that pulls bookings from a Google
          Sheet and lets the CEO regenerate any booking&apos;s ZIP of
          documents in the browser, without touching the Python CLI. About two
          seconds per regeneration, sixteen files in the ZIP.
        </p>
        <ul className="space-y-3 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl list-disc pl-6 marker:text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
              GET /api/days
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
              GET /api/generate?date=YYYY-MM-DD
            </code>{" "}
            return the current ZIP for any event date in roughly two seconds.
          </li>
          <li>
            HMAC-signed session cookie behind a password gate, Zod validation
            on every input, all secrets held only in Vercel environment
            variables — no client-side keys.
          </li>
          <li>
            Shared Jinja2 templates and brand stylesheet with the Python
            prototype, so the web tool and the CLI produce identical output.
          </li>
          <li>
            Twelve-phase intake form at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
              /add-event
            </code>{" "}
            now in active build — phases one through four are live, the
            remaining phases are the next iteration.
          </li>
        </ul>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The nine missing touchpoints
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-6">
          The communication audit mapped 49 existing touchpoints across nine
          booking-lifecycle stages. The piece the CEO flagged as the
          highest-impact finding from this workstream was a list of nine
          touchpoints we weren&apos;t sending at all — places where customers
          expected to hear from the company but didn&apos;t.
        </p>
        <ul className="space-y-2 max-w-3xl">
          {missingTouchpoints.map((t) => (
            <li
              key={t.id}
              className="flex gap-4 text-base sm:text-lg leading-relaxed text-foreground/90"
            >
              <span className="font-mono text-sm text-muted-foreground w-8 shrink-0 pt-0.5">
                {t.id}
              </span>
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Tech stack
        </h2>
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Python prototype
            </p>
            <div className="flex flex-wrap gap-2">
              {pythonStack.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="h-7 text-sm font-normal px-3"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Live Next.js companion
            </p>
            <div className="flex flex-wrap gap-2">
              {nextStack.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="h-7 text-sm font-normal px-3"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Sample documents
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-6">
          Four of the eight day-of documents the pipeline generates, from a
          sample Sarah-and-Mark booking. Same templates the live tool ships.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sampleDocs.map((d) => (
            <a
              key={d.href}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border/50 bg-card/30 p-5 hover:border-foreground/40 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-medium text-base">{d.title}</div>
                <Download className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {d.blurb}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What&apos;s next
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          The intake form at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
            /add-event
          </code>{" "}
          continues through phases five to twelve over the summer. The nine
          missing touchpoints from the audit get wired into the email-delivery
          layer as the platform team finishes the database work.
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
          href={LIVE_TOOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          View live tool
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </a>
      </section>
    </article>
  );
}
