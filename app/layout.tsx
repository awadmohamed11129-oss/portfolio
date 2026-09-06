import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Instrument_Serif } from "next/font/google";
import SiteAnalytics from "@/components/SiteAnalytics";
import { PortfolioProvider } from "@/components/shell/PortfolioProvider";
import { Navigation } from "@/components/shell/Navigation";
import { WorldStage } from "@/components/shell/WorldStage";
import { DestinationColumn } from "@/components/shell/DestinationColumn";
import { RouteCompatibility } from "@/components/shell/RouteCompatibility";
import { DIRECT, SITE_URL } from "@/content/links";
import { profile } from "@/content/profile";
import "./globals.css";
import "./portfolio.css";
import "./stage.css";

const manrope = Manrope({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const instrument = Instrument_Serif({ variable: "--font-fraunces", subsets: ["latin"], weight: "400", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: profile.metaTitle, template: "%s | Mohamad Awad" },
  description: profile.metaDescription,
  openGraph: { title: profile.metaTitle, description: profile.metaDescription, type: "website", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: profile.metaTitle, description: profile.metaDescription },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={manrope.variable + " " + instrument.variable}>
    <PortfolioProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <WorldStage />
      <RouteCompatibility />
      <DestinationColumn>{children}
      <footer className="site-footer" id="contact">
        <div className="footer-identity"><Link href="/">Mohamad Awad</Link><p>Civil engineering. Practical software.</p></div>
        <nav aria-label="Footer"><Link href="/contact">Get in touch</Link><Link href="/resume">Resume</Link><a href={DIRECT.github} target="_blank" rel="noopener noreferrer">GitHub</a></nav>
        <p>Toronto, Canada</p>
      </footer>
      </DestinationColumn>
      {process.env.VERCEL === "1" ? <SiteAnalytics /> : null}
    </PortfolioProvider>
  </body></html>;
}
