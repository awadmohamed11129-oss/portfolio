import type { Fact } from "./facts";

/**
 * Case studies are data, not pages.
 *
 * A case study is an ordered list of blocks. `components/case/CaseRenderer.tsx`
 * turns them into markup. That split is what lets three sessions work at once:
 * S1 restyles every case study without touching a word of copy, S2 swaps
 * imagery without touching layout, and copy changes never touch either.
 *
 * Adding a block kind means adding a renderer for it. Keep the union small --
 * the constraint is what keeps the pages looking like one system.
 */

export type Media = {
  readonly src: string;
  readonly alt: string;
  /** Intrinsic size. Required so the reserved box is correct and CLS stays flat. */
  readonly width: number;
  readonly height: number;
  readonly caption?: string;
};

/** A figure counts as a number on the site, so a stat carries a Fact. */
export type Stat = {
  readonly label: string;
  readonly fact: Fact;
  /** Optional qualifier. This is where a measurement states its conditions. */
  readonly note?: string;
};

export type NamedItem = {
  readonly title?: string;
  /** Paragraphs. One string per paragraph -- never embed markup. */
  readonly body: readonly string[];
};

export type Block =
  /** Body copy under an optional heading. The workhorse. */
  | { readonly kind: "prose"; readonly heading?: string; readonly body: readonly string[] }
  /** One image that carries weight on its own. */
  | { readonly kind: "figure"; readonly heading?: string; readonly media: Media }
  /** Images that only mean something side by side (labels vs predictions). */
  | { readonly kind: "figureGrid"; readonly heading?: string; readonly media: readonly Media[] }
  /** The headline numbers. */
  | { readonly kind: "stat"; readonly heading?: string; readonly items: readonly Stat[]; readonly note?: string }
  /** Attributed, always. An unattributed quote does not ship. */
  | { readonly kind: "quote"; readonly heading?: string; readonly text: string; readonly attribution: string }
  /** Discrete points that are not paragraphs: datasets, decisions, principles. */
  | { readonly kind: "list"; readonly heading?: string; readonly items: readonly NamedItem[]; readonly style?: "cards" | "bullets" }
  /** Set apart from the flow: a caveat, a limitation, a correction. */
  | { readonly kind: "callout"; readonly heading: string; readonly body: readonly string[]; readonly tone?: "note" | "limitation" }
  /** A hand-drawn SVG in components/case/diagrams, referenced by id. */
  | { readonly kind: "diagram"; readonly heading?: string; readonly id: DiagramId; readonly note?: string };

export type DiagramId = "pavescan-pipeline" | "chapel-pipeline" | "civic-pipeline";

/** An outbound link. `slug` routes through /go for click tracking. */
export type CaseLink = {
  readonly label: string;
  readonly slug?: string;
  readonly href?: string;
  readonly icon?: "external" | "github" | "download";
};

export type CaseStudy = {
  readonly slug: string;
  readonly title: string;
  /** Kicker above the title: what kind of work this was, and when. */
  readonly eyebrow: string;
  /** One or two sentences. Doubles as the meta description. */
  readonly summary: string;
  readonly metaDescription: string;
  readonly links: readonly CaseLink[];
  /** Shown under the links -- access caveats, confidentiality notes. */
  readonly linkNote?: string;
  /** A quick statement of contribution, deliverable, and project status. */
  readonly overview?: readonly { readonly label: string; readonly value: string }[];
  readonly hero?: Media;
  readonly stack?: readonly { readonly label: string; readonly items: readonly string[] }[];
  readonly blocks: readonly Block[];
  /**
   * A direction-specific cinematic component owned by S1/S2, composed OUTSIDE
   * the block list so the union stays small and copy never has to know what a
   * set-piece is. `after` is the block index it slots behind; omit it and the
   * set-piece sits above the blocks, under the hero. Moving the drive sequence
   * between the homepage and this page is an index change, not a copy edit.
   */
  readonly setPiece?: { readonly id: string; readonly after?: number };
};

/** A card in the projects grid. `href` absent means there is no case study. */
export type ProjectTeaser = {
  /** Featured entries are capped by the collection; all entries remain listed. */
  readonly featured?: boolean;
  readonly title: string;
  readonly context: string;
  readonly blurb: string;
  readonly chips: readonly string[];
  readonly href?: string;
  readonly media?: Media;
  /** Replaces the "View project" affordance when there is no page. */
  readonly noteInPlaceOfLink?: string;
};

export type Role = {
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly dates: string;
  readonly bullets: readonly string[];
};

export type SkillGroup = { readonly label: string; readonly items: readonly string[] };

export type ContactLink = {
  readonly label: string;
  readonly href: string;
  readonly display: string;
  readonly icon: "mail" | "github" | "linkedin" | "resume";
  readonly external: boolean;
};
