import type { CaseStudy } from "../types";
import { pavescan as f } from "../facts";

/** September survey claims; the preserved August scoring sweep is historical. */
export const pavescanCase: CaseStudy = {
  slug: "pavescan-ai",
  title: "PaveScan AI",
  eyebrow: "Independent project, 2026",
  summary: "A research tool that turns dashcam footage into a map of possible road damage and an estimated condition score. Every finding links back to the footage for review.",
  metaDescription: `Dashcam pavement inspection across ${f.routeKm.value} of scored Toronto road: ${f.frames.value} frames and ${f.defects.value} findings, with uncertainty kept visible.`,
  links: [
    { label: "Open the demo", slug: "pavescan-demo", icon: "external" },
    { label: "Source on GitHub", slug: "pavescan-github", icon: "github" },
    { label: "September demo report", slug: "pavescan-report", icon: "download" },
  ],
  linkNote: "The demo may require sign-in and may differ from the local build. The September report calls AI findings 'defects'; they have not been reviewed. Its condition estimates and repair priorities follow ideas from ASTM D6433 and need checking on site. This is not a certified survey.",
  overview: [
    { label: "My contribution", value: "Video processing, connecting detection models, GPS records, scoring and reports" },
    { label: "Output", value: "Findings linked to the footage, a map and a sample report" },
    { label: "Status", value: "Independent research tool; estimated condition, not a certified inspection" },
  ],
  hero: {
    src: "/images/pavescan/report-summary-september-2026.png",
    alt: "Excerpt from PaveScan's September 2026 automated demo report showing estimated street condition and the asset management summary",
    width: 2550, height: 1880,
    caption: "September 2026 automated demo report. Unreviewed model findings and condition estimates require field review; the table's 'defects' are model findings.",
  },
  stack: [
    { label: "Detection", items: ["PyTorch", "YOLO11", "SegFormer-B2", "ONNX Runtime", "OpenCV"] },
    { label: "Scoring and reporting", items: ["Python", "ASTM D6433 density approach", "ReportLab", "Folium", "Streamlit", "pytest"] },
  ],
  blocks: [
    { kind: "stat", heading: "The bundled Toronto survey", items: [
      { label: "Road covered by the score", fact: f.routeKm, note: "Six separate stretches, not one continuous route" },
      { label: "Video frames checked", fact: f.frames, note: `Sampled at ${f.frameSpacing.value} intervals` },
      { label: "Findings", fact: f.defects, note: `${f.shadowSuspects.value} are flagged as possible shadows` },
      { label: "Estimated road condition (PCI)", fact: f.pci, note: `${f.pciRating.value}; PCI means Pavement Condition Index. Read the limits below.` },
    ], note: "The length of road covered by the score differs from the distance on the dashcam odometer. These figures describe this demo, not performance on all roads." },
    { kind: "prose", heading: "Why I built it", body: [
      "I wanted to reduce repetitive image review in road inspections. I built the video processing, connected the detection models, and added GPS mapping, condition estimates and reports. Every finding links back to its footage so a person can check it.",
    ] },
    { kind: "diagram", heading: "How a clip becomes a report", id: "pavescan-pipeline" },
    { kind: "prose", heading: "Finding possible damage", body: [
      "The software samples frames, looks for cracks and other damage on the pavement, and combines nearby sightings. Extra checks flag likely shadows and utility covers.",
      `In the September demo, ${f.sightings.value} sightings became ${f.defects.value} findings. These are not confirmed, distinct defects: a long crack can appear more than once. The scorer excludes ${f.coversExcluded.value} suspected utility covers, leaving ${f.scored.value} scored findings.`,
    ] },
    { kind: "callout", heading: "A scoring bug I fixed", tone: "note", body: [
      `In an August experiment, changing the reporting sections from 25 to 500 metres moved the score from ${f.legacyHigh.value} to ${f.legacyLow.value}, even though the input was the same. The old scorer added penalties without accounting for the area surveyed.`,
      `I replaced it with fixed road areas scored by damage density, following the approach in ASTM D6433. The saved August test returned ${f.pciAugustSweep.value} across the reporting lengths tested. That verifies this fix, not accuracy on every road.`,
    ] },
    { kind: "callout", heading: "What still needs checking", tone: "limitation", body: [
      `${f.shadowSuspects.value} of the ${f.defects.value} findings are possible shadows. A large finding count does not prove accurate detection. That needs testing against independently labelled images.`,
      "Damage size depends on camera angle and image scale. A qualified inspector must check the road; the score is an estimate, not a certified field survey. Section scores and source images help reviewers see what the overall average hides.",
    ] },
    { kind: "prose", heading: "What I learned", body: [
      "A useful report needs to show where its numbers come from and where they might be wrong. My next steps are independent accuracy testing and better measurements of damage size.",
    ] },
  ],
};
