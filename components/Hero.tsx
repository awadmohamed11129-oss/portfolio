import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="grid gap-12 sm:gap-16 sm:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="anim-rise text-xs uppercase tracking-[0.22em] text-primary/80 mb-5 font-medium">
            <span className="anim-rule inline-block w-8 h-px bg-primary/60 align-middle mr-3" />
            Toronto, ON · Civil engineering · TMU
          </p>
          <h1
            className="anim-rise font-[family-name:var(--font-fraunces)] text-6xl sm:text-7xl lg:text-[5rem] font-medium leading-[1.02] tracking-tight"
            style={{ animationDelay: "0.08s" }}
          >
            Mohamad <span className="italic text-primary">Awad</span>
          </h1>
          <p
            className="anim-rise mt-6 text-lg sm:text-xl text-foreground/75 max-w-xl leading-relaxed"
            style={{ animationDelay: "0.16s" }}
          >
            Civil engineering at Toronto Metropolitan University. I build AI
            and automation tools: computer vision that scores pavement
            against ASTM D6433, and production data pipelines over
            Toronto&apos;s civic open data.
          </p>
          <div
            className="anim-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "0.24s" }}
          >
            <Link
              href="/#projects"
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
        <div
          className="anim-rise hidden sm:block relative shrink-0"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-primary/15 blur-2xl"
          />
          <Image
            src="/images/headshot.jpg"
            alt="Mohamad Awad"
            width={224}
            height={224}
            priority
            sizes="(min-width: 1024px) 224px, 192px"
            className="relative h-48 w-48 lg:h-56 lg:w-56 rounded-full object-cover ring-1 ring-primary/30 ring-offset-4 ring-offset-background"
          />
        </div>
      </div>
      </div>
    </section>
  );
}
