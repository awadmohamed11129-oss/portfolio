import type { Metadata } from "next";
import { AboutContent } from "@/components/portfolio/AboutContent";
export const metadata: Metadata = { title: "About", description: "Meet Mohamad Awad, a civil engineering student at Toronto Metropolitan University.", alternates: { canonical: "/about" }, openGraph: { title: "About | Mohamad Awad", description: "Meet Mohamad Awad, a civil engineering student at Toronto Metropolitan University.", url: "/about" } };
export default function AboutPage() { return <AboutContent />; }
