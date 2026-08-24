import { DIRECT } from "./links";
import { pavescan, civic } from "./facts";
import type { ContactLink } from "./types";

/**
 * Identity and the two long-form site sections.
 *
 * Standing copy rules enforced here: the identity line is "civil engineering
 * student at Toronto Metropolitan University" with no academic year and no
 * minor; "built" means an artifact exists, "live" only where something is
 * actually serving; no em or en dashes anywhere in user-facing strings.
 */

export const profile = {
  name: "Mohamad Awad",
  /** Eyebrow above the name. */
  location: "Toronto, ON",
  discipline: "Civil engineering",
  school: "TMU",
  url: "mohamadawad.vercel.app",

  /** Hero. Leads with a measured result rather than a self-description. */
  intro:
    "I'm a civil engineering student at Toronto Metropolitan University who " +
    "writes the software side of infrastructure work. My main project has " +
    `scored ${pavescan.routeKm.value} of real Toronto road surface against the ` +
    "ASTM D6433 condition standard, from dashcam footage, without anyone " +
    "walking it.",

  metaTitle: "Mohamad Awad",
  metaDescription:
    "Civil engineering student at Toronto Metropolitan University. I build " +
    "pavement inspection from computer vision, production ETL over Toronto " +
    "open data, and automation tools that replace manual document work.",
} as const;

/** The About section. One string per paragraph. */
export const about: readonly string[] = [
  "I'm a civil engineering student at Toronto Metropolitan University. Most " +
    "infrastructure inspection still happens the way it did forty years ago: " +
    "someone walks the surface with a clipboard and tallies deduct values by " +
    "hand. The standards behind that work are sound. The bottleneck is how " +
    "long it takes to cover a network. That gap is what I build for.",

  "PaveScan is where most of my time goes. It reads dashcam footage of a road " +
    `and returns a condition score under ASTM D6433. Across the ${pavescan.routeKm.value} ` +
    `of Toronto road that ships with it, that meant ${pavescan.frames.value} frames, ` +
    `${pavescan.defects.value} distinct defects, and a network score of ` +
    `${pavescan.pci.value}. Building it taught me more about being wrong than about ` +
    "being right: I spent a week chasing a training run that had quietly " +
    "corrupted its own checkpoints, and later found that the score itself moved " +
    `${pavescan.legacySpread.value} depending on a reporting setting that should ` +
    "not have touched it.",

  "Before that I spent the summer as a data engineer at a Toronto smart-city " +
    "startup, writing production ingestors for the city's open mobility data " +
    `and a signal engine over ${civic.years311.value} of 311 service requests. ` +
    "Toronto's open data is messy in every way real data is messy, and most of " +
    "the work was deciding what the pipeline should refuse to claim.",

  "I also led the document-automation workstream on a consulting project for a " +
    "Canadian micro-wedding company, replacing about eight hours of copy-paste " +
    "per booking with a pipeline that runs in ten seconds. And when I got tired " +
    "of paying for voice dictation, I built a local version that runs on my own " +
    "GPU for nothing.",

  "The thread through all of it is the same. Find the part of the job that is " +
    "careful, repetitive, and slow, and give it to a machine that does not get " +
    "bored. That is the work I want to do in a civil engineering co-op.",
];

export const contact = {
  heading: "Get in touch",
  blurb:
    "I'm looking for a civil engineering co-op or placement. Anything " +
    "adjacent to infrastructure, data, or automation is worth a conversation.",
  links: [
    {
      label: "Email",
      href: DIRECT.email,
      display: "mohamad.awad@torontomu.ca",
      icon: "mail",
      external: false,
    },
    {
      label: "GitHub",
      href: DIRECT.github,
      display: "github.com/awadmohamed11129-oss",
      icon: "github",
      external: true,
    },
    {
      label: "LinkedIn",
      href: DIRECT.linkedin,
      display: "in/mohamad-awad",
      icon: "linkedin",
      external: true,
    },
    {
      label: "Resume",
      href: DIRECT.resume,
      display: "Mohamad_Awad_Resume.pdf",
      icon: "resume",
      external: true,
    },
  ] satisfies readonly ContactLink[],
} as const;
