/**
 * Every number that appears on this site, with the source it came from.
 *
 * The rule: a figure without a traceable source does not ship. `fact()` throws
 * on an empty source, and because these modules are imported by statically
 * rendered pages, an unsourced number fails `next build` rather than surviving
 * to be caught by a human audit that nobody re-runs after the next copy edit.
 *
 * Current PaveScan values come from the frozen September 5 evidence fixture.
 * August scorer experiments, class counts and clip exports remain historical;
 * their scope must travel with them whenever a component renders them.
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
   * an August export scored 85 across the survey and 97 over one clip
   * alone. Left in prose, the historical scope drifts away from
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
const SCORER = `${RESULTS} via src.reporting.{pci,segments}, historical recomputation 2026-08-24`;
const AUGUST = "historical August 24, 2026 analysis; not a current survey measurement";

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
 * SCOPE WARNING. Current figures refer to the full September export; fields
 * labelled AUGUST are historical. The August frame-sequence export covered
 * only one clip (695.4 m, 139 frames, estimated PCI 97).
 * Never place a route-level number beside single-clip imagery without the scope
 * showing. Both numbers are true and they are three points of the document
 * apart.
 */
const DRIVE = "the full demo survey, 3,571 m scored across six separate stretches";
const SEPTEMBER = "docs/evidence/pavescan-figures-2026-09-05.json, reconciled with the September 4 honesty ruling";

export const pavescan = {
  /* Scored extent differs from odometer or within-clip travel. */
  routeKm: fact(
    "3.571 km",
    `${SEPTEMBER} -> route.scored_length_m = 3571; scored spatial extent, not dashcam odometer`,
    DRIVE,
  ),
  clips: fact(
    "7",
    `${SEPTEMBER} -> route.clips`,
    DRIVE,
  ),
  stretches: fact(
    "six",
    `${SEPTEMBER} -> route.stretches; seven clips form six separate stretches`,
    DRIVE,
  ),
  criticalsTopClip: fact(
    "9 of the 14",
    "results.json defects joined to manifest.json frames by best_frame: " +
      "clip 5 holds 9 criticals, clip 2 has 2, clip 3 has 2, clip 6 has 1",
    AUGUST,
  ),
  frames: fact("693", `${SEPTEMBER} -> frames.total`, DRIVE),
  frameSpacing: fact("5 m", `${SEPTEMBER} -> frames.spacing_m`, DRIVE),
  sightings: fact("613", `${SEPTEMBER} -> defects.raw_sightings`, DRIVE),
  defects: fact("385", `${SEPTEMBER} -> defects.detected; findings, not distinct physical defects`, DRIVE),
  mergeRadius: fact("2.5 m", `${SEPTEMBER} -> defects.merge_radius_m`, DRIVE),
  scored: fact("377", `${SEPTEMBER} -> defects.scored`, DRIVE),
  coversExcluded: fact("8", `${SEPTEMBER} -> defects.excluded_as_utility_covers`, DRIVE),
  critical: fact(
    "1",
    `${SEPTEMBER} -> distribution.by_priority_scored.critical`,
    DRIVE,
  ),
  /* Carries its own scale. A bare "85" reads as ambiguous next to percentages,
   * and PCI is a 0-100 index where 100 is a road in perfect condition. */
  pci: fact(
    "85/100",
    `${SEPTEMBER} -> pci.score; 55 sample units and 100 m reporting segments`,
    DRIVE,
  ),
  pciRating: fact("Good", `${SEPTEMBER} -> pci.rating`, DRIVE),
  shadowSuspects: fact("275", `${SEPTEMBER} -> defects.shadow_suspects; included in findings, not confirmed defects`, DRIVE),
  sampleUnits: fact("55", `${SEPTEMBER} -> pci.sample_units`, DRIVE),
  segments: fact("38", `${SEPTEMBER} -> pci.segments`, DRIVE),
  pciAugustSweep: fact("85/100", `${SCORER} -> density across 25 to 500 m reporting lengths`, AUGUST),
  pciSpread: fact(
    "0 points",
    `${SCORER} -> identical 85 at every segment length from 25 to 500 m`,
    AUGUST,
  ),
  longitudinal: fact("235", `${SCORER} -> class_name counts over scored findings`, AUGUST),
  transverse: fact("76", `${SCORER} -> class_name counts over scored findings`, AUGUST),
  alligator: fact("17", `${SCORER} -> class_name counts over scored findings`, AUGUST),
  potholes: fact("13", `${SCORER} -> class_name counts over scored findings`, AUGUST),

  /* Scorer behaviour, not route measurements.
   *
   * Recomputed 2026-08-24 by running BOTH scorers over the same defects at
   * every segment length, rather than quoting the T7 ledger. Doing so extended
   * the result: the ledger stopped at 300 m and reported a 52 point spread, but
   * the legacy scorer keeps falling to 22 at 500 m, which is a 67 point spread
   * over the range where the density scorer is measured and flat. The rating
   * swing is the part that lands: the same road reads Good or Very Poor
   * depending on a reporting setting. */
  legacySpread: fact(
    "67 points",
    `${SCORER} -> segment_pci(method="legacy") sweep: 89 at 25 m down to 22 at 500 m`,
    `${AUGUST}; retired legacy scorer, same input`,
  ),
  legacyHigh: fact("89", `${SCORER} -> legacy at 25 m`, `${AUGUST}; legacy scorer`),
  legacyLow: fact("22", `${SCORER} -> legacy at 500 m`, `${AUGUST}; legacy scorer`),
  legacyRatingHigh: fact("Good", `${SCORER} -> legacy rating at 25 m`, `${AUGUST}; legacy scorer`),
  legacyRatingLow: fact("Very Poor", `${SCORER} -> legacy rating at 500 m`, `${AUGUST}; legacy scorer`),
  sampleUnit: fact(
    "224 m\u00b2",
    "August T7 ledger: fixed sample-unit grid in the density scorer",
    AUGUST,
  ),
  extentSensitivity: fact(
    "12 points",
    "August T7 ledger G4: PCI moves 90 to 78 as assumed extent per detection scales 0.5x to 2x",
    AUGUST,
  ),

  /* Model metrics, measured on a held-out validation split, not on the drive. */
  boxMap: fact(
    "0.816",
    "V2 fine-tune, 200 epochs. portfolio-site main@2c445ed " +
      "app/projects/pavescan-ai/page.tsx, carried forward from the V2 training run",
    "historical V2 training validation split; not Toronto dashcam accuracy",
  ),
  maskMap: fact(
    "0.395",
    "V2 fine-tune, 200 epochs. Same source as boxMap",
    "historical V2 training validation split; not Toronto dashcam accuracy",
  ),
} as const;

/**
 * Honest anchors for a distance-based section spine.
 *
 * D3's spine wants to anchor sections at real distances into the survey. There
 * is no such axis. `cum_dist_m` looks exactly like one (5.3 m to 3489.2 m,
 * monotonic, no gaps) and is not: it advances 8.0 m between clips 2 and 3 while
 * those clips are 10.29 km apart. Anchoring a section at "1,873 m in" would be
 * a number that exists in the data and means nothing on the ground. It is the
 * precise failure this lane exists to prevent, so it is written down here.
 *
 * What IS honest: distance WITHIN a stretch, and the identity of the stretch.
 * Anchor to these. Clips 0 and 1 are the only contiguous pair, so they form one
 * stretch; the rest stand alone.
 *
 * Note stretch 4: it is a single frame covering no distance. Calling it a
 * "stretch" is generous, and any copy that walks the stretches should either
 * say that or skip it rather than let it pad a count.
 */
export const surveyStretches = {
  source:
    "pavescan-ai/data/demo/demo_scan/manifest.json -> clips[] contiguity plus " +
    "per-clip cum_dist_m deltas, computed 2026-08-24",
  scope: AUGUST,
  rows: [
    { stretch: 1, clips: [0, 1], frames: 279, metres: 1385, note: "the only contiguous pair" },
    { stretch: 2, clips: [2], frames: 91, metres: 450, note: "" },
    { stretch: 3, clips: [3], frames: 59, metres: 290, note: "" },
    { stretch: 4, clips: [4], frames: 1, metres: 0, note: "a single frame, no distance" },
    { stretch: 5, clips: [5], frames: 124, metres: 615, note: "historical August priority labels: 9 of the then-14 criticals" },
    { stretch: 6, clips: [6], frames: 139, metres: 690, note: "" },
  ],
} as const;

/**
 * The set-piece dataset: both scorers across every segment length.
 *
 * Lives here rather than inside the set-piece component so the motion lane
 * never hardcodes a number. One source covers the whole table because it is a
 * single command's output, not fourteen independent claims.
 *
 * Measured three times independently and in agreement, which is what makes the
 * historical experiment reproducible: the T7 track measured the
 * legacy collapse, S2 reproduced the flat density line with PaveScan's own
 * scorer, and this table was recomputed from scratch on 2026-08-24 for the
 * site. The legacy 500 m value is new here; T7's sweep stopped at 300 m.
 */
export const pciSweep = {
  source:
    "pavescan-ai/data/demo/demo_scan/results.json via " +
    "network_pci(segment_pci(exclude_manhole_suspects(defects), coords, L, method=...)), " +
    "recomputed 2026-08-24",
  scope: AUGUST,
  rows: [
    { segmentM: 25, legacy: 89, legacyRating: "Good", density: 85 },
    { segmentM: 50, legacy: 80, legacyRating: "Satisfactory", density: 85 },
    { segmentM: 100, legacy: 68, legacyRating: "Fair", density: 85 },
    { segmentM: 150, legacy: 58, legacyRating: "Fair", density: 85 },
    { segmentM: 200, legacy: 50, legacyRating: "Poor", density: 85 },
    { segmentM: 300, legacy: 37, legacyRating: "Very Poor", density: 85 },
    { segmentM: 500, legacy: 22, legacyRating: "Very Poor", density: 85 },
  ],
} as const;

/**
 * The first clip only, for use beside single-clip imagery.
 *
 * Reported by S1 from `public/drive/`. Present so that if imagery stays
 * clip-scoped, the copy beside it has correctly scoped numbers to use instead
 * of borrowing the route-level ones.
 */
const CLIP = "historical August imagery export of the first clip only; not the current full survey";

export const pavescanClip = {
  pci: fact("97", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  frames: fact("139", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  lengthM: fact("695.4 m", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
  candidates: fact("13", "public/drive/ manifest for CH1-20260815-072223.TS, via S1", CLIP),
} as const;

/** Toronto smart-city placement. Client work under a confidentiality agreement. */
export const civic = {
  datasets: fact("six", "private placement briefing, July 6, 2026: six mobility ingestors, plus 311"),
  lines: fact("9,400", "private placement briefing, July 6, 2026, section 6"),
  tests: fact("800+", "private placement briefing, July 6, 2026: reported testing total across placement work", "historical reported aggregate; not a verified unique test-suite count"),
  rows: fact("4M+", "private placement briefing, July 6, 2026: rows of public data processed"),
  years311: fact("eight years", "private placement briefing, July 6, 2026: 311 archive, 2018 through 2025"),
  rows311: fact("500,000", "private placement briefing, July 6, 2026: approximate 311 rows per year"),
  trafficSessions: fact("44,737", "private placement briefing, July 6, 2026: traffic-count sessions back to 1993"),
  bikeTrips: fact("7 million", "private placement briefing, July 6, 2026: bike-share trips per year"),
  wards: fact("25", "private placement briefing, July 6, 2026: City of Toronto ward boundary file"),
  renameRise: fact("10.6%", "private placement briefing, July 6, 2026: true signal after historical division mapping"),
  covidReal: fact("32%", "private placement briefing, July 6, 2026: real growth once zero-count months were handled"),
  covidReported: fact("85%", "private placement briefing, July 6, 2026: inflated figure before the fix"),
  rating: fact("5.0 / 5", "approved placement review excerpt preserved from portfolio-site main@2c445ed"),
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
    "August 19, 2026 verify bench on one Windows PC; GPU path",
  ),
  latency: fact(
    "939 ms",
    "C:/Garage/wispr-clone/README.md: mean latency, GPU STT, measured 2026-08-19; " +
      "bench/accuracy-2026-07-25/",
    "August 19, 2026 verify bench on one Windows PC; GPU path",
  ),
  speedup: fact("3.5x", "C:/Garage/wispr-clone/README.md: against the CPU fallback path"),
  cost: fact("$0", "C:/Garage/wispr-clone/README.md: no subscription and no API keys", "subscription and API fees; hardware and electricity excluded"),
  replaces: fact("$15/mo", "C:/Garage/wispr-clone/README.md: the subscription it replaced"),
} as const;

/** Every fact group on the site, for the G5 table. Add new groups here too. */
export const ALL_FACTS = { pavescan, pavescanClip, civic, chapel, localflow } as const;

/** Structured datasets that are not single facts but still carry a source. */
export const ALL_DATASETS = { pciSweep, surveyStretches } as const;
