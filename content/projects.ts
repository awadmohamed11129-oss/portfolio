import type { ProjectTeaser } from "./types";
import { pavescan, localflow } from "./facts";

/** Four case studies and one explicitly unbuilt coursework entry. */
export const teasers: readonly ProjectTeaser[] = [
  {
    title: "PaveScan AI",
    featured: true,
    context: "Independent project, 2026",
    blurb:
      "Dashcam footage becomes a map of possible road damage. " +
      `The Toronto demo scores ${pavescan.routeKm.value} of road and keeps ` +
      "uncertain findings visible for review.",
    chips: ["Computer vision", "Pavement condition", "Python"],
    href: "/projects/pavescan-ai",
    media: {
      src: "/images/pavescan/report-summary-september-2026.png",
      alt: "Excerpt from PaveScan's September 2026 automated demo report showing estimated street condition and the asset management summary",
      width: 2550,
      height: 1880,
      caption: "September 2026 automated demo report. Unreviewed model findings and condition estimates require field review; the table's 'defects' are model findings.",
    },
  },
  {
    title: "Civic Data Pipeline",
    featured: true,
    context: "Work placement, May to July 2026",
    blurb:
      "Six Toronto mobility datasets and eight years of 311 requests. " +
      "I built tools to clean the data and find trends, with checks for missing " +
      "dates and misleading growth figures.",
    chips: ["Open data", "Data processing", "PostgreSQL"],
    href: "/projects/civic-data-pipeline",
  },
  {
    title: "Pop-Up Chapel Co.",
    context: "Student consulting, April to May 2026",
    blurb:
      "One booking becomes a set of branded wedding-day documents. " +
      "I led the email and document work, identified missing messages, " +
      "and built a Python prototype and companion web tool.",
    chips: ["Document automation", "Python", "Next.js"],
    href: "/projects/pop-up-chapel",
    media: {
      src: "/images/popup-chapel/live-site-home.png",
      alt: "The Pop-Up Chapel booking-driven document generator",
      width: 1425,
      height: 944,
    },
  },
  {
    title: "LocalFlow",
    context: "Personal tool, 2026",
    blurb:
      "Hold a key, speak, and text appears at the cursor. It runs on my PC. " +
      `The August test measured a ${localflow.wer.value} word error rate and ` +
      `${localflow.latency.value} average wait for text.`,
    chips: ["On-device AI", "Voice dictation", "Windows"],
    href: "/projects/localflow",
  },
  {
    title: "Engineering Design Project",
    context: "TMU coursework, 2025",
    blurb:
      "Requirements, sketches, and CAD models for a mobile storage cart for " +
      "unhoused individuals and a walking cane concept. The designs considered " +
      "durability, weather resistance, and one-handed use.",
    chips: ["CAD", "Design documentation"],
    noteInPlaceOfLink: "Coursework, design and CAD only. No physical prototype.",
  },
];
