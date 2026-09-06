import type { Metadata } from "next";
import { CaseRenderer } from "@/components/case/CaseRenderer";
import { civicDataCase } from "@/content/case/civic-data";

const study = civicDataCase;

export const metadata: Metadata = {
  title: study.title,
  description: study.metaDescription,
  alternates: { canonical: "/projects/civic-data-pipeline" },
  openGraph: { title: `${study.title} - Mohamad Awad`, description: study.metaDescription, url: "/projects/civic-data-pipeline" },
  twitter: {
    card: "summary_large_image",
    title: `${study.title} - Mohamad Awad`,
    description: study.metaDescription,
  },
};

export default function Page() {
  return <CaseRenderer study={study} />;
}
