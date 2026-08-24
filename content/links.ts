/**
 * Every external URL on this site, once.
 *
 * Prose never contains a URL. Case studies link by `slug`, which resolves
 * through `/go/<slug>` -- that route is how outbound clicks get counted at all,
 * because Vercel custom events are Pro-only and pageviews of an internal
 * redirect are the workaround. Do not bypass it.
 *
 * PaveScan's host is moving to an Oracle VM. When it does, exactly one line in
 * this file changes.
 */

export const SITE_URL = "https://mohamadawad.vercel.app";

/** Outbound links routed through /go/<slug> for click tracking. */
export const TRACKED = {
  "pavescan-demo": {
    href: "https://pavescan-ai-kctjew6jj8tccs79an5dcd.streamlit.app/",
    label: "the PaveScan live demo",
  },
  "pavescan-github": {
    href: "https://github.com/awadmohamed11129-oss/pavescan-ai",
    label: "the PaveScan source on GitHub",
  },
  "pavescan-report": {
    href: "/pdfs/pavescan-sample-report.pdf",
    label: "the sample PDF report",
  },
} as const;

export type TrackedSlug = keyof typeof TRACKED;

/** Links that are not click-tracked. */
export const DIRECT = {
  email: "mailto:mohamad.awad@torontomu.ca",
  github: "https://github.com/awadmohamed11129-oss",
  linkedin: "https://www.linkedin.com/in/mohamad-awad-38071239b/",
  resume: "/pdfs/Mohamad_Awad_Resume.pdf",
  chapelTool: "https://popup-chapel-docs.vercel.app",
  torontoOpenData: "https://open.toronto.ca/",
} as const;

/** Build the href for a tracked slug. */
export const go = (slug: TrackedSlug) => `/go/${slug}`;
