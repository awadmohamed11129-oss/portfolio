import { DIRECT } from "./links";
import type { ContactLink } from "./types";

export const profile = {
  name: "Mohamad Awad",
  location: "Toronto, ON",
  discipline: "Civil engineering",
  school: "TMU",
  url: "mohamadawad.vercel.app",
  intro:
    "I'm a civil engineering student at Toronto Metropolitan University. " +
    "I build software for pavement inspection, Toronto open data, and the " +
    "repetitive work that gets in people's way.",
  metaTitle: "Mohamad Awad",
  metaDescription:
    "Civil engineering student at Toronto Metropolitan University. " +
    "Pavement inspection research, Toronto open-data pipelines, and practical automation.",
} as const;

/** Shared by the About page and the room phone. */
export const about: readonly string[] = [
  "I'm interested in the point where engineering judgement meets software: " +
    "what a measurement can tell you, what it leaves out, and how to make the " +
    "result useful to someone doing the work.",
  "PaveScan is my independent pavement-inspection project. It turns dashcam " +
    "footage into findings that can be reviewed on a map, with an estimated " +
    "condition score. Building it has meant spending as much time questioning " +
    "the scoring and false positives as working on the models.",
  "During a work placement with a Toronto smart-city startup, I wrote " +
    "ingestors for public mobility data and a signal engine for 311 service " +
    "requests. I also led document automation on a student consulting " +
    "engagement for Pop-Up Chapel Co. LocalFlow, my local voice-dictation " +
    "tool, came from a smaller problem: wanting to dictate without another subscription.",
];

export const contact = {
  heading: "Get in touch",
  blurb:
    "I'm looking for a civil engineering co-op or placement, especially " +
    "work involving infrastructure, data, or automation.",
  links: [
    { label: "Email", href: DIRECT.email, display: "mohamad.awad@torontomu.ca", icon: "mail", external: false },
    { label: "GitHub", href: DIRECT.github, display: "awadmohamed11129-oss", icon: "github", external: true },
    { label: "LinkedIn", href: DIRECT.linkedin, display: "Mohamad Awad", icon: "linkedin", external: true },
    { label: "Resume", href: DIRECT.resume, display: "Download PDF", icon: "resume", external: true },
  ] satisfies readonly ContactLink[],
} as const;
