import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Redirector from "./Redirector";

// Click tracking on the Hobby plan: custom events are Pro-only, so outbound
// clicks are counted as pageviews of these internal redirect routes instead.
const LINKS: Record<string, { href: string; label: string }> = {
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
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LINKS).map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = LINKS[slug];
  if (!link) notFound();
  return <Redirector href={link.href} label={link.label} />;
}
