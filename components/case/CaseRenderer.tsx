import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/BrandIcons";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Block, CaseLink, CaseStudy, Media } from "@/content/types";
import { go } from "@/content/links";
import { Diagram } from "./diagrams";

/**
 * Renders a CaseStudy from content/case/*.
 *
 * Styling here is deliberately neutral and semantic. S1 owns the design system;
 * when their tokens land, the classes in this file get swapped and not one word
 * of copy moves. That separation is the point of the block model, so resist
 * putting copy in this file even when it would be quicker.
 *
 * The set-piece is composed OUTSIDE the block list, via the `setPiece` slot on
 * CaseStudy, so a direction-specific cinematic component can sit at any index
 * without the union having to know it exists.
 */

function Figure({ media, priority = false }: { media: Media; priority?: boolean }) {
  return (
    <figure className="my-8 first:mt-0">
      <Image
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        priority={priority}
        sizes="(min-width: 1024px) 976px, 100vw"
        className="h-auto w-full rounded-lg border border-border/50"
      />
      {media.caption ? (
        <figcaption className="mt-3 text-sm text-muted-foreground">{media.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
      {children}
    </h2>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <div className="max-w-3xl space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90">
            {block.body.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </section>
      );

    case "figure":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <Figure media={block.media} />
        </section>
      );

    case "figureGrid":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            {block.media.map((m) => (
              <figure key={m.src + m.caption} className="rounded-lg border border-border/50 bg-card/30 p-3">
                <Image
                  src={m.src}
                  alt={m.alt}
                  width={m.width}
                  height={m.height}
                  sizes="(min-width: 640px) 480px, 100vw"
                  className="h-auto w-full rounded-md"
                />
                {m.caption ? (
                  <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                    {m.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      );

    case "stat":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <dl className="grid gap-x-8 gap-y-6 rounded-lg border border-border/50 border-l-4 border-l-primary/70 bg-card/40 p-6 sm:grid-cols-4">
            {block.items.map((s) => (
              <div key={s.label}>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-medium">
                  {s.fact.value}
                </dd>
                {s.note ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.note}</p>
                ) : null}
              </div>
            ))}
          </dl>
          {block.note ? (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{block.note}</p>
          ) : null}
        </section>
      );

    case "quote":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <figure className="rounded-lg border border-border/50 border-l-4 border-l-primary/60 bg-card/30 p-6">
            <blockquote className="max-w-3xl text-base sm:text-lg leading-relaxed text-foreground/90">
              {block.text}
            </blockquote>
            <figcaption className="mt-4 text-sm text-muted-foreground">
              {block.attribution}
            </figcaption>
          </figure>
        </section>
      );

    case "list": {
      const cards = block.style !== "bullets";
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          {cards ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {block.items.map((item) => (
                <div
                  key={item.title ?? item.body[0]?.slice(0, 32)}
                  className="rounded-lg border border-border/60 bg-card/30 p-5"
                >
                  {item.title ? (
                    <h3 className="font-[family-name:var(--font-fraunces)] mb-2 text-xl font-medium tracking-tight">
                      {item.title}
                    </h3>
                  ) : null}
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/80 sm:text-base">
                    {item.body.map((p) => (
                      <p key={p.slice(0, 32)}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="max-w-3xl list-disc space-y-3 pl-6 text-base leading-relaxed text-foreground/90 marker:text-muted-foreground sm:text-lg">
              {block.items.map((item) => (
                <li key={item.title ?? item.body[0]?.slice(0, 32)}>
                  {item.title ? <span className="font-medium">{item.title}. </span> : null}
                  {item.body.join(" ")}
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    }

    case "callout":
      /* tone="limitation" carries the honest admissions. They are evidence, not
       * warnings, so they get body weight and a rule rather than alarm colour.
       * If this ever renders as a caution box, the page argues against itself. */
      return (
        <section className="mb-16 sm:mb-20">
          <div
            className={`rounded-lg border border-border/50 bg-card/30 p-6 sm:p-8 ${
              block.tone === "limitation" ? "border-l-4 border-l-muted-foreground/50" : "border-l-4 border-l-primary/70"
            }`}
          >
            <h2 className="font-[family-name:var(--font-fraunces)] mb-4 text-2xl font-medium tracking-tight sm:text-3xl">
              {block.heading}
            </h2>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-foreground/90 sm:text-lg">
              {block.body.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      );

    case "diagram":
      return (
        <section className="mb-16 sm:mb-20">
          {block.heading ? <Heading>{block.heading}</Heading> : null}
          <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30 p-4 sm:p-6">
            <Diagram id={block.id} />
          </div>
          {block.note ? (
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{block.note}</p>
          ) : null}
        </section>
      );
  }
}

function LinkButton({ link, primary }: { link: CaseLink; primary: boolean }) {
  const href = link.slug ? go(link.slug as Parameters<typeof go>[0]) : link.href;
  if (!href) return null;
  const Icon =
    link.icon === "github" ? GithubIcon : link.icon === "download" ? Download : ExternalLink;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ size: "lg", variant: primary ? "default" : "outline" })}
    >
      <Icon className="mr-1.5 h-4 w-4" />
      {link.label}
    </a>
  );
}

export function CaseRenderer({
  study,
  setPiece,
}: {
  study: CaseStudy;
  /** Rendered at `study.setPiece.after`. Owned by S1/S2, opaque to content. */
  setPiece?: React.ReactNode;
}) {
  const at = study.setPiece?.after;
  return (
    <article className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <header className="mb-16 sm:mb-20">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {study.eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          {study.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {study.summary}
        </p>
        {study.links.length > 0 ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {study.links.map((l, i) => (
              <LinkButton key={l.label} link={l} primary={i === 0} />
            ))}
          </div>
        ) : null}
        {study.linkNote ? (
          <p className="mt-3 max-w-2xl text-xs text-muted-foreground">{study.linkNote}</p>
        ) : null}
        {study.hero ? <Figure media={study.hero} priority /> : null}
      </header>

      {setPiece && at === undefined ? setPiece : null}

      {study.blocks.map((block, i) => (
        <div key={`${block.kind}-${i}`}>
          <BlockView block={block} />
          {setPiece && at === i ? setPiece : null}
        </div>
      ))}

      {study.stack ? (
        <section className="mb-16 sm:mb-20">
          <Heading>Tech stack</Heading>
          <div className="space-y-5">
            {study.stack.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((t) => (
                    <Badge key={t} variant="secondary" className="h-7 px-3 text-sm font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-10 sm:flex-row sm:items-center">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to home
        </Link>
      </footer>
    </article>
  );
}
