import type { Metadata } from "next";
import { ExperienceContent } from "@/components/portfolio/ExperienceContent";
export const metadata: Metadata = { title: "Experience", description: "Civil engineering education, project experience, and technical skills of Mohamad Awad.", alternates: { canonical: "/experience" }, openGraph: { title: "Experience | Mohamad Awad", description: "Civil engineering education, project experience, and technical skills of Mohamad Awad.", url: "/experience" } };
export default function ExperiencePage() { return <ExperienceContent />; }
