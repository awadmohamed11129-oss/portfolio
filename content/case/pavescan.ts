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
      "Road inspections need careful observation and consistent scoring. I wanted software to take on some of the repetitive image review while keeping a link from every result to the footage that produced it.",
      "I built the video processing steps, connected the detection and filtering models, linked findings to GPS positions, and developed the scoring and reports. Someone reviewing the result can inspect each record and correct it.",
    ] },
    { kind: "prose", heading: "From footage to a finding", body: [
      `The sample contains ${f.clips.value} clips across ${f.stretches.value} separate stretches of Toronto road. The software picks frames at set distances, links them to locations, and combines nearby sightings of the same type within a ${f.mergeRadius.value} radius.`,
      `${f.sightings.value} raw sightings become ${f.defects.value} findings. These are not all confirmed or separate defects: a long crack can produce several records, and some findings are mistakes.`,
      `The scorer excludes ${f.coversExcluded.value} suspected utility covers, leaving ${f.scored.value} scored findings. ${f.shadowSuspects.value} findings are flagged as possible shadows. They remain visible so a reviewer can see where the model is uncertain.`,
    ] },
    { kind: "diagram", heading: "How a clip becomes a report", id: "pavescan-pipeline" },
    { kind: "prose", heading: "Finding damage and checking for mistakes", body: [
      "One model traces crack pixels, a process called segmentation. Another detects road damage. A road-surface model keeps the search on the pavement, while further models flag likely shadows and utility covers that can look like damage.",
      "Mistakes still get through. Each finding keeps its source image, the sightings combined into it, and flags that show where the models are uncertain.",
    ] },
    { kind: "callout", heading: "A scoring bug that changed the design", tone: "note", body: [
      `In the August 2026 experiment, the old scorer gave ${f.legacyHigh.value} when the report grouped the road into 25 metre sections and ${f.legacyLow.value} at 500 metres, using the same input. That ${f.legacySpread.value} swing happened because penalties added up without accounting for the area surveyed.`,
      `The replacement scores a fixed grid of road areas, called sample units. It uses damage density, or damage relative to area, following the approach in ASTM D6433. The saved August test returned ${f.pciAugustSweep.value} across the reporting lengths tested. That supports this fix; it does not prove every future survey will behave the same way.`,
      `The September demo has ${f.sampleUnits.value} sample units and ${f.segments.value} reporting sections. An average across the road network can hide differences between stretches, so the report also keeps individual findings visible.`,
    ] },
    { kind: "callout", heading: "Where a person still needs to check", tone: "limitation", body: [
      "A qualified inspector still needs to check the road. Estimating damage size from an image depends on the camera angle, scale and how much pavement is visible. The score is an estimate, not a certified field survey.",
      `Possible shadows account for ${f.shadowSuspects.value} of the ${f.defects.value} findings in this sample. A large finding count or a plausible score does not tell us how accurate detection is. That needs a separate set of images with damage labelled independently of the model.`,
      "The overall score says little about a specific location. Maps, cropped images and scores for each road section let a reviewer check the summary against the records behind it.",
    ] },
    { kind: "prose", heading: "What I learned", body: [
      "The hardest part was deciding what a number meant. The length of road scored and the distance driven measure different things. A model finding may be a real defect or a mistake. Keeping those distinctions in the data changed the report and interface.",
      "The next useful improvement is to test against independently labelled images and measure the actual size of damage more accurately. Those checks would make the results easier to trust.",
    ] },
  ],
};
