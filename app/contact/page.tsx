import type { Metadata } from "next";
import { ContactContent } from "@/components/portfolio/ContactContent";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Mohamad Awad in Toronto about civil engineering co-ops, infrastructure, data, and automation.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact | Mohamad Awad", description: "Get in touch about civil engineering, infrastructure, data, and automation.", url: "/contact" },
};

export default function ContactPage() { return <ContactContent />; }
