import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid gap-12 sm:gap-16 sm:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Toronto, ON · 2nd-year civil engineering · TMU
          </p>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl font-medium leading-[1.05] tracking-tight">
            Mohamad Awad
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Civil engineering at Toronto Metropolitan University. I build AI
            and automation tools that help infrastructure get inspected, scored,
            and maintained.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#projects"
              className={buttonVariants({ size: "lg" })}
            >
              View projects
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <a
              href="/pdfs/Mohamad_Awad_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Resume
            </a>
            <a
              href="https://github.com/awadmohamed11129-oss"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
            >
              <GithubIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/mohamad-awad-38071239b/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
            >
              <LinkedinIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
        {/* Headshot slot — swap to <Image src="/images/headshot.jpg" /> when ready */}
        <div
          aria-hidden
          className="hidden sm:flex h-48 w-48 lg:h-56 lg:w-56 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 font-[family-name:var(--font-fraunces)] text-4xl text-muted-foreground/70"
        >
          MA
        </div>
      </div>
    </section>
  );
}
