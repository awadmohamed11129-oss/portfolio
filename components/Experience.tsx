import { Briefcase } from "lucide-react";

type Role = {
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
};

const roles: Role[] = [
  {
    title: "Data Engineer (Work Placement)",
    company: "Toronto smart-city startup",
    location: "Toronto, ON (remote)",
    dates: "May – Jul 2026",
    bullets: [
      "Built production ETL ingestors for six City of Toronto open mobility datasets, from traffic counts going back to 1993 to roughly 7 million bike-share trips a year, opened as three pull requests totalling about 9,400 lines.",
      "Wrote a signal engine over eight years of Toronto 311 data that surfaces rising complaint categories and hotspot zones, used in a live demo for a municipal government stakeholder.",
      "Shipped every dataset with contract tests and documentation — 800+ tests passing across the work, zero lines of teammates' code modified.",
    ],
  },
  {
    title: "Fitness Centre Desk Supervisor",
    company: "Toronto Metropolitan University",
    location: "Toronto, ON",
    dates: "May 2025 – Present",
    bullets: [
      "Supervise daily facility operations for 35+ staff, tracking task completion against safety and operational procedures.",
      "Inspect 30+ pieces of equipment per shift and submit service requests for any maintenance issues.",
    ],
  },
  {
    title: "Project Coordinator",
    company: "BrandEQ",
    location: "Toronto, ON",
    dates: "Jun – Aug 2024",
    bullets: [
      "Coordinated project timelines for 6+ client accounts, tracking deliverables and providing weekly status updates.",
      "Wrote weekly reports for clients summarizing account progress and recommended next steps, keeping each account on schedule.",
    ],
  },
];

export function Experience() {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl px-6 py-16 sm:py-20 border-t border-border/40"
    >
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight mb-10">
        Experience
      </h2>
      <ul className="space-y-10 max-w-3xl">
        {roles.map((role) => (
          <li key={`${role.title}-${role.company}`} className="flex gap-5">
            <div
              aria-hidden
              className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/30 text-muted-foreground"
            >
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg sm:text-xl font-medium">
                  {role.title}{" "}
                  <span className="text-muted-foreground font-normal">
                    — {role.company}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">{role.dates}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-1 mb-4">
                {role.location}
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-foreground/85 leading-relaxed">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
