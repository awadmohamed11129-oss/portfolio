import type { Metadata } from "next";
import { CaseRenderer } from "@/components/case/CaseRenderer";
import { popupChapelCase } from "@/content/case/popup-chapel";

const study = popupChapelCase;

export const metadata: Metadata = {
  title: study.title,
  description: study.metaDescription,
  alternates: { canonical: "/projects/pop-up-chapel" },
  openGraph: { title: `${study.title} - Mohamad Awad`, description: study.metaDescription, url: "/projects/pop-up-chapel" },
  twitter: {
    card: "summary_large_image",
    title: `${study.title} - Mohamad Awad`,
    description: study.metaDescription,
  },
};

export default function Page() {
  return <CaseRenderer study={study} />;
}
