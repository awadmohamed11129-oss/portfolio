import type { Metadata } from "next";
import { ProjectsContent } from "@/components/portfolio/ProjectsContent";
export const metadata: Metadata = { title: "Projects", description: "Engineering projects, automation tools, and data pipelines built by Mohamad Awad.", alternates: { canonical: "/projects" }, openGraph: { title: "Projects | Mohamad Awad", description: "Engineering projects, automation tools, and data pipelines built by Mohamad Awad.", url: "/projects" } };
export default function ProjectsPage() { return <ProjectsContent />; }
