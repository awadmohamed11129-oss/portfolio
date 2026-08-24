import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Redirector from "./Redirector";
import { TRACKED } from "@/content/links";

/**
 * Outbound click tracking.
 *
 * Vercel custom events are a paid feature, so outbound clicks are counted as
 * pageviews of these internal redirect routes instead. This is the only signal
 * Mohamad has for demo clicks. Do not bypass it by linking externally in copy.
 *
 * The URL map lives in content/links.ts so a host migration is a one-line
 * change in one file.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TRACKED).map((slug) => ({ slug }));
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
  const link = TRACKED[slug as keyof typeof TRACKED];
  if (!link) notFound();
  return <Redirector href={link.href} label={link.label} />;
}
