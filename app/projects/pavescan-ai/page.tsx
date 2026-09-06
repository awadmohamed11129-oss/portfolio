import type { Metadata } from "next";
import { CaseRenderer } from "@/components/case/CaseRenderer";
import { pavescanCase } from "@/content/case/pavescan";

const study = pavescanCase;

export const metadata: Metadata = {
  title: study.title,
  description: study.metaDescription,
  alternates: { canonical: "/projects/pavescan-ai" },
  openGraph: { title: `${study.title} - Mohamad Awad`, description: study.metaDescription, url: "/projects/pavescan-ai" },
  twitter: {
    card: "summary_large_image",
    title: `${study.title} - Mohamad Awad`,
    description: study.metaDescription,
  },
};

export default function Page() {
  return <CaseRenderer study={study} />;
}
