import type { ProjectTeaser } from "./types";
import { pavescan, civic, chapel, localflow } from "./facts";

/**
 * The projects grid. Five cards, four of which link to a case study.
 *
 * The engineering design project stays as a card but never links and never
 * claims fabrication: it was design and CAD work only. Mohamad confirmed that
 * framing on 2026-08-24. Do not add "prototyping", "built", or "fabricated" to
 * that entry.
 *
 * `media` is deliberately absent on the entries whose imagery S2 has not
 * produced yet. A missing image is a layout decision for S2, not a reason for
 * this file to invent a path.
 */
export const teasers: readonly ProjectTeaser[] = [
  {
    title: "PaveScan AI",
    context: "Independent project, 2026",
    blurb:
      `Reads dashcam footage of a road and scores the surface under ASTM D6433. ` +
      `Across the ${pavescan.routeKm.value} that ships with it: ${pavescan.frames.value} ` +
      `frames, ${pavescan.defects.value} distinct defects, network condition ` +
      `${pavescan.pci.value}. Includes the rebuild that stopped the score moving ` +
      `${pavescan.legacySpread.value} on a setting that should not have touched it.`,
    chips: ["PyTorch", "YOLO11", "ONNX", "ASTM D6433", "Python"],
    href: "/projects/pavescan-ai",
    media: {
      src: "/images/pavescan/val_batch0_pred.webp",
      alt: "Grid of pavement photographs with predicted crack segmentation masks overlaid, each detected defect in a different colour",
      width: 1200,
      height: 1200,
    },
  },
  {
    title: "Civic Data Pipeline",
    context: "Work placement, Toronto smart-city startup, 2026",
    blurb:
      `Production ETL for six City of Toronto mobility datasets and a signal ` +
      `engine over ${civic.years311.value} of 311 requests. ${civic.rows.value} rows, ` +
      `${civic.tests.value} tests. Most of the work was deciding what the pipeline ` +
      `should refuse to claim.`,
    chips: ["Python", "PostgreSQL", "ETL", "pytest"],
    href: "/projects/civic-data-pipeline",
    media: {
      src: "/images/civic-data/teaser.svg",
      alt: "Stylized line chart of civic data signals rising over time",
      width: 640,
      height: 400,
    },
  },
  {
    title: "Pop-Up Chapel Co.",
    context: "Riipen consulting engagement, 2026",
    blurb:
      `Led the document-automation workstream for a Canadian micro-wedding ` +
      `company. One booking in, ${chapel.docs.value} branded day-of documents out, ` +
      `in about ten seconds. Replaced roughly ${chapel.manualHours.value} of ` +
      `copy-paste per booking.`,
    chips: ["Python", "Pydantic", "Jinja2", "Next.js"],
    href: "/projects/pop-up-chapel",
    media: {
      src: "/images/popup-chapel/live-site-home.png",
      alt: "Home view of the Pop-Up Chapel companion tool, showing the booking-driven document generator",
      width: 1425,
      height: 944,
    },
  },
  {
    title: "LocalFlow",
    context: "Personal tool, 2026",
    blurb:
      `Voice dictation that runs entirely on my own machine. Hold a key, talk, ` +
      `release, and cleaned-up text lands at the cursor in any app. ` +
      `${localflow.wer.value} word error rate at ${localflow.latency.value} mean ` +
      `latency, for ${localflow.cost.value} against the ${localflow.replaces.value} ` +
      `subscription it replaced. I use it daily.`,
    chips: ["Whisper", "llama.cpp", "Python", "Vulkan"],
    href: "/projects/localflow",
  },
  {
    title: "Engineering Design Project",
    context: "TMU course project, 2025",
    blurb:
      "Course design work for a mobile storage cart for unhoused individuals, " +
      "plus a walking cane concept. Requirements, sketches, and CAD models " +
      "aimed at durability, weather resistance, and one-handed use.",
    chips: ["CAD", "Design documentation"],
    noteInPlaceOfLink: "Course project, design and CAD only",
  },
];
