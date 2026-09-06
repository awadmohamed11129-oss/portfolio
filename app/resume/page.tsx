import type { Metadata } from "next";
import { ResumeContent } from "@/components/portfolio/ResumeContent";

export const metadata: Metadata = {
  title: "Resume",
  description: "Mohamad Awad’s experience, engineering education, projects, and technical skills. Read online or download the resume PDF.",
  alternates: { canonical: "/resume" },
  openGraph: { title: "Resume | Mohamad Awad", description: "Civil engineering, data engineering, and practical software. Read Mohamad’s resume or download the PDF.", url: "/resume" },
};

export default function ResumePage() { return <ResumeContent />; }
