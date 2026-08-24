import type { DiagramId } from "@/content/types";

/**
 * Hand-drawn pipeline diagrams, one per case study.
 *
 * They draw with `currentColor` and no hard-coded palette, so they inherit
 * whatever S1's design system sets. Each has a <title> and <desc> that describe
 * the pipeline in words, because a screen reader gets nothing from the boxes.
 *
 * The PaveScan diagram was redrawn on 2026-08-24. The previous one described a
 * single photo upload, which stopped being what the system does once the
 * dashcam pipeline landed.
 */

const FONT =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
      </marker>
    </defs>
  );
}

function PaveScanPipeline() {
  return (
    <svg
      viewBox="0 0 1400 420"
      role="img"
      aria-labelledby="ps-title ps-desc"
      preserveAspectRatio="xMidYMid meet"
      className="w-full min-w-[760px] text-foreground"
      style={{ fontFamily: FONT }}
    >
      <title id="ps-title">How PaveScan turns dashcam clips into a condition score</title>
      <desc id="ps-desc">
        Seven dashcam clips, forming six separate stretches of road, are sampled
        into frames every five metres by GPS position. Each frame goes through two detection models running together. A
        road-surface mask and two trained classifiers then remove anything that
        is not pavement damage, including shadows and utility covers. Repeat
        sightings of the same defect are merged into single records. Those
        records are scored as distress density over a fixed sample-unit grid
        under ASTM D6433, producing a map, a per-segment report, and a PDF.
      </desc>
      <Arrow id="ps-arrow" />

      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="20" y="170" width="200" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="270" y="170" width="200" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="520" y="60" width="220" height="64" rx="8" strokeOpacity="0.55" />
        <rect x="520" y="150" width="220" height="64" rx="8" strokeOpacity="0.55" />
        <rect x="520" y="270" width="220" height="80" rx="8" strokeOpacity="0.55" strokeDasharray="4 3" />
        <rect x="790" y="170" width="200" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="1040" y="170" width="240" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
      </g>

      <g fill="currentColor" fontSize="14" textAnchor="middle">
        <text x="120" y="200">Dashcam clips</text>
        <text x="120" y="220" opacity="0.6">7 clips, 6 stretches</text>

        <text x="370" y="200">Frames by GPS</text>
        <text x="370" y="220" opacity="0.6">one every 5 m</text>

        <text x="630" y="88">Crack segmenter</text>
        <text x="630" y="107" opacity="0.6">instance masks</text>

        <text x="630" y="178">Damage detector</text>
        <text x="630" y="197" opacity="0.6">RDD2022 retrain</text>

        <text x="630" y="298">Road mask + judges</text>
        <text x="630" y="317" opacity="0.6">shadows, utility covers</text>
        <text x="630" y="335" opacity="0.6">removed from scoring</text>

        <text x="890" y="200">Merge sightings</text>
        <text x="890" y="220" opacity="0.6">within 2.5 m</text>

        <text x="1160" y="193" fontWeight="600">ASTM D6433 scoring</text>
        <text x="1160" y="213" opacity="0.6">density over sample units</text>
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#ps-arrow)">
        <path d="M220 205 L270 205" />
        <path d="M470 205 L495 205 L495 92 L520 92" />
        <path d="M470 205 L495 205 L495 182 L520 182" />
        <path d="M740 92 L765 92 L765 195 L790 195" />
        <path d="M740 182 L765 182 L765 195 L790 195" />
        <path d="M630 270 L630 220" />
        <path d="M990 205 L1040 205" />
      </g>
    </svg>
  );
}

function ChapelPipeline() {
  return (
    <svg
      viewBox="0 0 1400 320"
      role="img"
      aria-labelledby="pc-title pc-desc"
      preserveAspectRatio="xMidYMid meet"
      className="w-full min-w-[700px] text-foreground"
      style={{ fontFamily: FONT }}
    >
      <title id="pc-title">Pop-Up Chapel document generation pipeline</title>
      <desc id="pc-desc">
        A booking in JSON is validated against Pydantic schemas, then rendered
        through Jinja2 templates. A language model supplies the copy that varies
        between weddings, with a deterministic fallback. Headless Playwright
        prints the rendered pages, producing eight branded day-of documents in
        about ten seconds.
      </desc>
      <Arrow id="pc-arrow" />
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="40" y="180" width="180" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="260" y="180" width="220" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="520" y="180" width="200" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="520" y="40" width="200" height="70" rx="8" strokeOpacity="0.45" strokeDasharray="4 3" />
        <rect x="760" y="180" width="200" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="1000" y="180" width="240" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
      </g>
      <g fill="currentColor" fontSize="14" textAnchor="middle">
        <text x="130" y="219">Booking JSON</text>
        <text x="370" y="219">Pydantic schemas</text>
        <text x="620" y="219">Jinja2 templates</text>
        <text x="620" y="72">Generated copy</text>
        <text x="620" y="91" opacity="0.6">with a fixed fallback</text>
        <text x="860" y="219">Playwright render</text>
        <text x="1120" y="219" fontWeight="600">8 documents, ~10s</text>
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#pc-arrow)">
        <path d="M220 215 L260 215" />
        <path d="M480 215 L520 215" />
        <path d="M720 215 L760 215" />
        <path d="M960 215 L1000 215" />
        <path d="M620 110 L620 180" />
      </g>
    </svg>
  );
}

function CivicPipeline() {
  return (
    <svg
      viewBox="0 0 1400 400"
      role="img"
      aria-labelledby="cv-title cv-desc"
      preserveAspectRatio="xMidYMid meet"
      className="w-full min-w-[700px] text-foreground"
      style={{ fontFamily: FONT }}
    >
      <title id="cv-title">Civic data pipeline</title>
      <desc id="cv-desc">
        Toronto open datasets are pulled and audited, normalized into events and
        measures, then loaded into Postgres behind contract tests. A separate
        branch takes eight years of 311 data through a signal engine into JSON
        bundles with documented contracts, surfacing trends, hotspots, and early
        warnings.
      </desc>
      <Arrow id="cv-arrow" />
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="20" y="60" width="230" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="20" y="250" width="230" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="330" y="60" width="220" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="630" y="60" width="250" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
        <rect x="960" y="60" width="230" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="330" y="250" width="220" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
        <rect x="630" y="250" width="250" height="70" rx="8" strokeOpacity="0.55" />
        <rect x="960" y="250" width="230" height="70" rx="8" strokeOpacity="0.55" />
      </g>
      <g fill="currentColor" fontSize="14" textAnchor="middle">
        <text x="135" y="89">Six mobility datasets</text>
        <text x="135" y="109" opacity="0.6">Toronto Open Data</text>
        <text x="440" y="99">Pull and audit</text>
        <text x="755" y="89" fontWeight="600">Normalize</text>
        <text x="755" y="109" opacity="0.6">events and measures</text>
        <text x="1075" y="89">Postgres</text>
        <text x="1075" y="109" opacity="0.6">contract tests</text>
        <text x="135" y="279">311 archive</text>
        <text x="135" y="299" opacity="0.6">8 years</text>
        <text x="440" y="289" fontWeight="600">Signal engine</text>
        <text x="755" y="279">JSON bundles</text>
        <text x="755" y="299" opacity="0.6">documented contracts</text>
        <text x="1075" y="279">Readable signals</text>
        <text x="1075" y="299" opacity="0.6">trends, hotspots, warnings</text>
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#cv-arrow)">
        <path d="M250 95 L330 95" />
        <path d="M550 95 L630 95" />
        <path d="M880 95 L960 95" />
        <path d="M250 285 L330 285" />
        <path d="M550 285 L630 285" />
        <path d="M880 285 L960 285" />
      </g>
    </svg>
  );
}

export function Diagram({ id }: { id: DiagramId }) {
  switch (id) {
    case "pavescan-pipeline":
      return <PaveScanPipeline />;
    case "chapel-pipeline":
      return <ChapelPipeline />;
    case "civic-pipeline":
      return <CivicPipeline />;
  }
}
