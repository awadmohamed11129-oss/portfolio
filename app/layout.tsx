import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mohamadawad.vercel.app"),
  title: {
    default: "Mohamad Awad — Civil Engineering & AI at TMU",
    template: "%s — Mohamad Awad",
  },
  description:
    "Civil engineering student at Toronto Metropolitan University, building AI and automation tools for infrastructure inspection.",
  openGraph: {
    title: "Mohamad Awad — Civil Engineering & AI at TMU",
    description:
      "Civil engineering student at Toronto Metropolitan University, building AI and automation tools for infrastructure inspection.",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamad Awad — Civil Engineering & AI at TMU",
    description:
      "Civil engineering student at Toronto Metropolitan University, building AI and automation tools for infrastructure inspection.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <header className="border-b border-border/40 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-sm"
          >
            <Link
              href="/"
              className="font-[family-name:var(--font-fraunces)] text-base tracking-tight"
            >
              Mohamad Awad
            </Link>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/#projects"
                  className="hover:text-foreground transition-colors"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#experience"
                  className="hover:text-foreground transition-colors hidden sm:inline"
                >
                  Experience
                </Link>
              </li>
              <li>
                <Link
                  href="/#skills"
                  className="hover:text-foreground transition-colors hidden sm:inline"
                >
                  Skills
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <Analytics />
        <SpeedInsights />
        <footer className="border-t border-border/40 mt-24">
          <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
            <span>© {new Date().getFullYear()} Mohamad Awad</span>
            <span>Built with Next.js, Tailwind, shadcn/ui</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
