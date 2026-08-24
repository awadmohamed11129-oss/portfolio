import type { Role } from "./types";
import { civic } from "./facts";

/**
 * Roles, newest first.
 *
 * The TMU Fitness Centre role ENDED in July 2026. It read "May 2025 - Present"
 * on the live site, which was stale; Mohamad confirmed the end date on
 * 2026-08-24. Do not reintroduce "Present" here.
 *
 * Date ranges use "to" rather than a dash, per the no-en-dash copy rule.
 */
export const roles: readonly Role[] = [
  {
    title: "Data Engineer, work placement",
    company: "Toronto smart-city startup",
    location: "Toronto, ON (remote)",
    dates: "May to July 2026",
    bullets: [
      "Wrote production ingestors for six of the City of Toronto's open " +
        "mobility datasets, covering traffic counts back to 1993 and about " +
        `${civic.bikeTrips.value} bike-share trips a year. Shipped as three ` +
        `pull requests, roughly ${civic.lines.value} lines, all reviewed before merge.`,
      `Built a signal engine over ${civic.years311.value} of Toronto 311 data that ` +
        "finds rising complaint categories, hotspot areas, and early warnings, " +
        "and emits them as JSON with a written contract for whoever consumes it.",
      "Validating my own output against the raw public data caught two " +
        "artifacts that would have shipped a misleading story: a division " +
        "rename that invented a fake new complaint category, and a run of " +
        "pandemic-era zero-count months that inflated one growth figure from " +
        `${civic.covidReal.value} to ${civic.covidReported.value}.`,
      `Every dataset shipped with contract tests and documentation, ${civic.tests.value} ` +
        "tests passing across the work.",
    ],
  },
  {
    title: "Fitness Centre Desk Supervisor",
    company: "Toronto Metropolitan University",
    location: "Toronto, ON",
    dates: "May 2025 to July 2026",
    bullets: [
      "Ran daily floor operations for a team of 35, tracking task completion " +
        "against the facility's safety and operating procedures.",
      "Inspected 30 or more pieces of equipment each shift and filed service " +
        "requests for anything that needed maintenance.",
    ],
  },
  {
    title: "Project Coordinator",
    company: "BrandEQ",
    location: "Toronto, ON",
    dates: "June to August 2024",
    bullets: [
      "Tracked timelines and deliverables across six client accounts.",
      "Wrote the weekly client updates: what moved, what slipped, and what " +
        "needed a decision to keep the account on schedule.",
    ],
  },
];
