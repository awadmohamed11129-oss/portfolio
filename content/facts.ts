/**
 * Every number that appears on this site, with the source it came from.
 *
 * The rule: a figure without a traceable source does not ship. `fact()` throws
 * on an empty source, and because these modules are imported by statically
 * rendered pages, an unsourced number fails `next build` rather than surviving
 * to be caught by a human audit that nobody re-runs after the next copy edit.
 *
 * PaveScan figures were recomputed on 2026-08-24 from
 * `pavescan-ai/data/demo/demo_scan/results.json` using the app's own scorer,
 * not copied from a ledger. Two internal ledgers still quote `PCI 68`, which is
 * the retired legacy scorer; `cc9493f` made density the default and the current
 * value is 85. See `goals/active/2026-08-24-portfolio-S3-LEDGER.md`.
 */

export type Fact = {
  /** Rendered verbatim. Includes its own unit so callers cannot re-unit it. */
  readonly value: string;
  /** Where the value came from: a file, a command, or a named document. */
  readonly source: string;
  /**
   * What the value is measured over, when that is not obvious from the value.
   *
   * This exists because of a real near-miss caught during the rebuild: the
   * drive scores 85 over the whole 3.5 km route and 97 over its first clip
   * alone. Both numbers are correct. Left in prose, the scope drifts away from
   * the number the first time someone edits a sentence around it. Kept here, it
   * travels with the value, and a renderer can show it as a qualifier.
   */
  readonly scope?: string;
};

export function fact(value: string, source: string, scope?: string): Fact {
  if (!value.trim()) throw new Error("fact() called with an empty value");
  if (!source.trim()) {
    throw new Error(
      `fact("${value}") has no source. Every figure on this site must trace ` +
        `to a file, command, or document. If you cannot source it, cut it.`,
    );
  }
  return scope ? { value, source, scope } : { value, source };
}

const RESULTS = "pavescan-ai/data/demo/demo_scan/results.json";
const SCORER = `${RESULTS} via src.reporting.{pci,segments}, recomputed 2026-08-24`;

/**
 * The bundled Toronto drive.
 *
 * NOT A CONTINUOUS ROUTE. The 7 clips form six separate stretches, with jumps
 * of 0.89, 10.29, 4.27, 3.40 and 2.74 km between them. Never describe this as
 * "one continuous drive"; the shipped app's own caption does and is wrong.
 *
 * MAKE NO TIME-OF-DAY CLAIM. Clip filename timestamps are the dashcam's
 * internal clock, not local time: src/video/gps.py:40 says "hours-off from
 * local; internal use only", and hours past 23 get wrapped. Measured frame
 * brightness inverts the apparent ordering, so the nominally late clips are the
 * brightest in the set. No real clock time is recoverable. "Works day and
 * night" would be the best-sounding line on the page and it is unsupported.
 * `cum_dist_m` is a valid TOTAL but an invalid position axis, because it
 * bridges a 10 km cross-town gap with 8 metres. Never imply position along one
 * line.
 *
 * SCOPE WARNING. Every figure below describes the FULL survey. The frame
 * sequence in `public/drive/` currently covers only the first clip
 * (`CH1-20260815-072223.TS`, 695.4 m, 139 frames), which scores 97 on its own.
 * Never place a route-level number beside single-clip imagery without the scope
 * showing. Both numbers are true and they are three points of the document
 * apart.
 */
const DRIVE = "the full 3.5 km survey";

export const pavescan = {
  routeKm: fact(
    "3.5 km",
    `pavescan-ai/data/demo/demo_scan/manifest.json -> last frame cum_dist_m = 3489.22 m, summed within clips`,
    DRIVE,
  ),
  clips: fact(
    "7",
    `pavescan-ai/data/demo/demo_scan/manifest.json -> clips[] has 7 entries, each with a name and ` +
      "contiguous_with_prev; every frame also carries a clip index",
    DRIVE,
  ),
  stretches: fact(
    "six",
    `pavescan-ai/data/demo/demo_scan/manifest.json -> only clip index 1 has contiguous_with_prev true, ` +
      "so the 7 clips form 6 separate stretches",
    DRIVE,
  ),
  criticalsTopClip: fact(
    "9 of the 14",
    "results.json defects joined to manifest.json frames by best_frame: " +
      "clip 5 holds 9 criticals, clip 2 has 2, clip 3 has 2, clip 6 has 1",
    DRIVE,
  ),
  frames: fact("693", `${RESULTS} -> len(frames); all 693 carry lat/lon`, DRIVE),
  frameSpacing: fact("5 m", `${RESULTS} -> settings.frame_spacing_m = 5.0`, DRIVE),
  sightings: fact("613", `${RESULTS} -> sum of n_sightings across all defects`, DRIVE),
  defects: fact("385", `${RESULTS} -> len(defects)`, DRIVE),
  mergeRadius: fact("2.5 m", `${RESULTS} -> settings.merge_radius_m = 2.5`, DRIVE),
  scored: fact("377", `${SCORER} -> len(exclude_manhole_suspects(defects))`, DRIVE),
  coversExcluded: fact("8", `${SCORER} -> 385 minus 377`, DRIVE),
  critical: fact(
    "14",
    `${SCORER} -> safety_priority critical after cover exclusion; 19 before`,
    DRIVE,
  ),
  pci: fact(
    "85",
    `${SCORER} -> network_pci of segment_pci = 85 at 25, 50, 100, 150, 200, 300 and 500 m`,
    DRIVE,
  ),
  pciRating: fact("Good", `${SCORER} -> rating returned alongside PCI 85`, DRIVE),
  pciSpread: fact(
    "0 points",
    `${SCORER} -> identical 85 at every segment length from 25 to 500 m`,
    DRIVE,
  ),
  longitudinal: fact("235", `${SCORER} -> class_name counts over scored defects`, DRIVE),
  transverse: fact("76", `${SCORER} -> class_name counts over scored defects`, DRIVE),
  alligator: fact("17", `${SCORER} -> class_name counts over scored defects`, DRIVE),
  potholes: fact("13", `${SCORER} -> class_name counts over scored defects`, DRIVE),

  /* Scorer behaviour, not route measurements. */
  legacySpread: fact(
    "52 points",
    "goals/active/2026-08-23-T7-pci-density-LEDGER.md G3: the legacy scorer " +
      "read 89 at 25 m and 37 at 300 m on identical data",
    "the retired legacy scorer, same drive",
  ),
  legacyHigh: fact("89", "T7 ledger G3 sweep table, legacy column at 25 m", "legacy scorer"),
  legacyLow: fact("37", "T7 ledger G3 sweep table, legacy column at 300 m", "legacy scorer"),
  sampleUnit: fact(
    "224 m\u00b2",
    "T7 ledger: the fixed ASTM D6433 sample-unit grid the density scorer uses",
  ),
  extentSensitivity: fact(
    "12 points",
    "T7 ledger G4: PCI moves 90 to 78 as assumed extent per detection scales 0.5x to 2x",
  ),

  /* Model metrics, measured on a held-out validation split, not on the drive. */
  boxMap: fact(
    "0.816",
    "V2 fine-tune, 200 epochs. portfolio-site main@2c445ed " +
      "app/projects/pavescan-ai/page.tsx, carried forward from the V2 training run",
    "held-out validation split",
  ),
  maskMap: fact(
    "0.395",
    "V2 fine-tune, 200 epochs. Same source as boxMap",
    "held-out validation split",
  ),
} as const;

/**
 * The first clip only, for use beside single-clip imagery.
 *
 * Reported by S1 from `public/drive/`. Present so that if imagery stays
 * clip-scoped, the copy beside it has correctly scoped numbers to use instead
 * of borrowing the route-level ones.
 */
const CLIP = "the first clip of the drive only";

export const pavescanClip = {
  pci: fact("97", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  frames: fact("139", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  lengthM: fact("695.4 m", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  candidates: fact("13", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
} as const;

/** Toronto smart-city placement. Client work under a confidentiality agreement. */
export const civic = {
  datasets: fact("six", "portfolio-site main@2c445ed: six mobility ingestors, plus 311"),
  lines: fact("9,400", "main@2c445ed app/projects/civic-data-pipeline/page.tsx"),
  tests: fact("800+", "main@2c445ed: contract tests across the placement's work"),
  rows: fact("4M+", "main@2c445ed: rows of public data processed"),
  years311: fact("eight years", "main@2c445ed: 311 archive, 2018 through 2025"),
  rows311: fact("500,000", "main@2c445ed: approximate 311 rows per year"),
  trafficSessions: fact("44,737", "main@2c445ed: traffic-count sessions back to 1993"),
  bikeTrips: fact("7 million", "main@2c445ed: bike-share trips per year"),
  wards: fact("25", "main@2c445ed: City of Toronto ward boundary file"),
  renameRise: fact("10.6%", "main@2c445ed: true signal after historical division mapping"),
  covidReal: fact("32%", "main@2c445ed: real growth once zero-count months were handled"),
  covidReported: fact("85%", "main@2c445ed: inflated figure before the fix"),
  rating: fact("5.0 / 5", "main@2c445ed: placement's final review, every category"),
} as const;

/** Riipen consulting engagement, April to May 2026. */
export const chapel = {
  hours: fact("60", "main@2c445ed app/projects/pop-up-chapel/page.tsx"),
  stipend: fact("$1,400", "main@2c445ed: engagement stipend"),
  docs: fact("eight", "main@2c445ed: branded day-of documents per booking"),
  runtime: fact("ten seconds", "main@2c445ed: one booking to eight PDFs"),
  webRuntime: fact("two seconds", "main@2c445ed: companion tool regeneration"),
  zipFiles: fact("16", "main@2c445ed: files in the generated ZIP"),
  manualHours: fact("eight hours", "main@2c445ed: manual document work per booking, before"),
  cities: fact("six", "main@2c445ed: cities the company operates across"),
  team: fact("three", "main@2c445ed: student team size"),
  touchpointsAudited: fact("49", "main@2c445ed: existing touchpoints mapped in the audit"),
  missing: fact("nine", "main@2c445ed: touchpoints the company was not sending at all"),
  rating: fact("5.0 / 5", "main@2c445ed: project's final review"),
} as const;

/** LocalFlow: local voice dictation, built to replace a paid subscription. */
export const localflow = {
  wer: fact(
    "3.5%",
    "C:/Garage/wispr-clone/README.md: end-to-end word error rate on the verify bench",
    "the verify bench, GPU path",
  ),
  latency: fact(
    "939 ms",
    "C:/Garage/wispr-clone/README.md: mean latency, GPU STT, measured 2026-08-19; " +
      "bench/accuracy-2026-07-25/",
    "the verify bench, GPU path",
  ),
  speedup: fact("3.5x", "C:/Garage/wispr-clone/README.md: against the CPU fallback path"),
  cost: fact("$0", "C:/Garage/wispr-clone/README.md: no subscription and no API keys"),
  replaces: fact("$15/mo", "C:/Garage/wispr-clone/README.md: the subscription it replaced"),
} as const;

/** Every fact group on the site, for the G5 table. Add new groups here too. */
export const ALL_FACTS = { pavescan, pavescanClip, civic, chapel, localflow } as const;
