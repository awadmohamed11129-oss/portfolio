import type { CaseStudy } from "../types";
import { pavescan as f } from "../facts";

/**
 * PaveScan AI.
 *
 * This page was rewritten on 2026-08-24. The version it replaced described a
 * single fine-tuned model scored against four sample photographs and spent its
 * middle third on a tour of the app's screens. None of the dashcam pipeline was
 * on the site, and the headline score was the retired legacy scorer's.
 *
 * Two rules for anyone editing this file:
 *   1. Figures come from `content/facts.ts`, never typed inline. Every one of
 *      them was recomputed from the scan's own results file, not read off a
 *      ledger. Two internal ledgers still quote a PCI of 68, which is the old
 *      scorer's number and is wrong.
 *   2. Write results and decisions, not navigation. The app's screens are not
 *      the story, and the hosting platform is a stack line, not a narrative beat.
 */
export const pavescanCase: CaseStudy = {
  slug: "pavescan-ai",
  title: "PaveScan AI",
  eyebrow: "Independent project, 2026",
  summary:
    "A pavement inspection system that reads dashcam footage of a road and " +
    "scores the surface under ASTM D6433. It has already surveyed " +
    `${f.routeKm.value} of Toronto road across six separate stretches.`,
  metaDescription:
    `Pavement inspection from dashcam video: ${f.frames.value} frames across ` +
    `${f.routeKm.value} of Toronto road, ${f.defects.value} distinct defects, and ` +
    `an ASTM D6433 condition score of ${f.pci.value}. Includes the scoring rebuild ` +
    `that removed a ${f.legacySpread.value} dependence on a reporting setting.`,
  links: [
    { label: "Open the live demo", slug: "pavescan-demo", icon: "external" },
    { label: "Source on GitHub", slug: "pavescan-github", icon: "github" },
    { label: "Sample PDF report", slug: "pavescan-report", icon: "download" },
  ],
  linkNote:
    "The demo is a walkthrough of the workflow and asks for a one-time Google " +
    "or GitHub sign-in. Every figure on this page was measured from the " +
    "project's current build.",
  hero: {
    src: "/images/pavescan/val_batch0_pred.webp",
    alt: "A grid of held-out pavement photographs with the model's predicted defect masks drawn over them, each detected instance in its own colour",
    width: 1200,
    height: 1200,
    caption:
      "Predictions on held-out validation images. Each colour is a separate " +
      "detected defect instance.",
  },
  stack: [
    {
      label: "Detection",
      items: ["PyTorch", "Ultralytics YOLO11", "SegFormer-B2", "ONNX Runtime", "OpenCV", "SAHI"],
    },
    {
      label: "Scoring and output",
      items: ["ASTM D6433", "Python 3.12", "ReportLab", "Folium", "Streamlit", "pytest"],
    },
  ],
  blocks: [
    {
      kind: "stat",
      heading: "A Toronto survey, scored",
      items: [
        {
          label: "Road surveyed",
          fact: f.routeKm,
          note: `${f.clips.value} clips over ${f.stretches.value} separate stretches`,
        },
        {
          label: "Frames analysed",
          fact: f.frames,
          note: `sampled every ${f.frameSpacing.value} by GPS`,
        },
        {
          label: "Distinct defects",
          fact: f.defects,
          note: `merged from ${f.sightings.value} raw sightings`,
        },
        {
          label: "Network condition",
          fact: f.pci,
          note: `rated ${f.pciRating.value} under ASTM D6433`,
        },
      ],
      note:
        "Measured from the scan that ships with the project, not an " +
        "illustrative example.",
    },
    {
      kind: "prose",
      heading: "The problem",
      body: [
        "A Pavement Condition Index survey is done by a trained inspector " +
          "walking the surface and tallying deduct values by hand against ASTM " +
          "D6433. The standard is not the problem. It has been refined for " +
          "decades and it works. The problem is that a person can only walk so " +
          "far in a day, so a municipality with a few thousand lane kilometres " +
          "either surveys a sample and extrapolates, or surveys everything on a " +
          "cycle long enough that the early results are stale before the last " +
          "ones are collected.",
        "So the target was never a better standard. It was the same standard at " +
          "a different cost per kilometre. If a camera on a dashboard can " +
          "produce the inputs the standard already asks for, the survey gets " +
          "cheap enough to run often, and the scoring behind it does not change " +
          "at all.",
      ],
    },
    {
      kind: "prose",
      heading: "The survey",
      body: [
        `The footage is ${f.clips.value} dashcam clips covering ` +
          `${f.routeKm.value} of Toronto road. It is not one continuous drive, ` +
          `and that turns out to matter: the clips form ${f.stretches.value} ` +
          "separate stretches in different parts of the city, with gaps of up " +
          "to ten kilometres between them. So the numbers below are not one " +
          "lucky pass down a single street. They are the same detector holding " +
          "up across six unrelated pieces of road.",
        "The pipeline pulls position from the dashcam's own telemetry and from " +
          "the data burned into the video image, then samples a frame every " +
          `${f.frameSpacing.value} of travel rather than every few seconds. ` +
          "Sampling by distance is the difference between a survey and a pile " +
          "of photographs: stopping at a red light no longer produces two " +
          `hundred pictures of the same intersection. That gives ` +
          `${f.frames.value} frames, each carrying a position.`,
        `Detection across those frames returns ${f.sightings.value} defect ` +
          "sightings, which is not the same as finding that many defects. A " +
          "crack visible from thirty metres back is still visible from twenty, " +
          "and from ten. Sightings of the same class within " +
          `${f.mergeRadius.value} of each other collapse into a single record, ` +
          `which takes ${f.sightings.value} sightings down to ${f.defects.value} ` +
          "distinct defects. Each merged record keeps the sightings that fed " +
          "it, so a defect seen six times can be told apart from one seen once, " +
          "and the report can say which is which.",
      ],
    },
    {
      kind: "diagram",
      heading: "How a clip becomes a score",
      id: "pavescan-pipeline",
    },
    {
      kind: "prose",
      heading: "What actually looks at the road",
      body: [
        "One model was not good enough, so there are four, and two of them " +
          "exist to disagree with the other two. The first pair find things: an " +
          "instance segmentation model fine-tuned for cracks, and a detector " +
          "retrained on the RDD2022 road damage set, which handles potholes and " +
          "the shallow angle a dashcam sees better than the segmenter does. " +
          "Running both and merging where they overlap recovers defects that " +
          "either one alone would miss.",
        "The second pair exist to say no. A road-surface model masks everything " +
          "that is not pavement, so a cracked wall at the edge of frame cannot " +
          "become a road defect. Then two small trained classifiers screen what " +
          "survives: one for shadows, which look like cracks and are not, and " +
          "one for utility covers, which are dark, roughly round, genuinely on " +
          "the road, and not damage.",
        `On this drive the cover classifier pulled ${f.coversExcluded.value} ` +
          `manhole covers out of the score, leaving ${f.scored.value} of ` +
          `${f.defects.value} defects scored. They are flagged in the report ` +
          "rather than deleted, because an inspector should be able to see what " +
          "the machine chose to ignore and overrule it.",
        `Of the defects that scored, ${f.longitudinal.value} are longitudinal ` +
          `cracks, ${f.transverse.value} transverse, ${f.alligator.value} ` +
          `alligator cracking, and ${f.potholes.value} potholes. ` +
          `${f.critical.value} were flagged critical.`,
        `Those criticals are not spread evenly. ${f.criticalsTopClip.value} sit ` +
          "in a single clip, which is the sort of thing a network-level average " +
          "hides completely. A score of 85 across the whole survey and a stretch " +
          "of road carrying most of the urgent defects are both true at once, " +
          "and the second one is what actually dispatches a crew. It is the " +
          "argument for reporting per segment rather than per network, and " +
          "against reading too much into any single headline number, including " +
          "the one at the top of this page.",
      ],
    },
    {
      kind: "callout",
      heading: "The number that did not mean anything",
      tone: "note",
      body: [
        "For a while PaveScan reported a condition score that changed depending " +
          "on how the route was chopped up for reporting. Same drive, same " +
          `defects, same day: ${f.legacyHigh.value} if the route was reported in ` +
          `25 metre segments, ${f.legacyLow.value} in 300 metre segments. A ` +
          `${f.legacySpread.value} spread on a 100 point scale, controlled ` +
          "entirely by a display setting.",
        "The cause was that the old scorer summed a per-defect penalty without " +
          "normalising by area, so a longer segment accumulated more penalty " +
          "for being longer. That is not a rounding error or a tuning problem. " +
          "The quantity being reported was not a property of the road.",
        "The fix was to score the way the standard actually scores. Distress " +
          "becomes a density over a fixed sample unit of about " +
          `${f.sampleUnit.value}, that density is read against the standard's ` +
          "deduct curves, corrected for how many distress types are present, " +
          "and subtracted from 100. Because the sample grid depends only on the " +
          "length of the route and not on how the route is later sliced for a " +
          `report, the score stops moving: ${f.pci.value} at 25, 50, 100, 150, ` +
          `200, 300 and 500 metre segments. A spread of ${f.pciSpread.value}.`,
        "Digitising the standard's curves turned up a second bug worth " +
          "admitting. Those curves are drawn in imperial units, and a density " +
          "is only unit-free when the quantity is itself an area. Reading a " +
          "pothole count per square metre against a curve drawn per square foot " +
          "is wrong by a factor of about ten, which scored a single medium " +
          "pothole at 32 instead of 81. Quantities are converted before the " +
          "density is taken now, and three tests hold it there.",
      ],
    },
    {
      kind: "prose",
      heading: "What broke in training, and how long it hid",
      body: [
        "The segmentation fine-tune ran at 1280 pixel input with heavy " +
          "augmentation. Around sixty epochs in, training loss kept falling " +
          "while validation accuracy went flat and the saved best checkpoint " +
          "stopped improving, well before anything should have converged.",
        "The weights were fine. The exponential moving average copy of them was " +
          "not. Mixed precision was on by default, and at that resolution the " +
          "loss surface produced occasional non-finite gradients that the loss " +
          "scaler absorbed without raising anything. The live weights kept " +
          "training correctly, but the averaged buffers were quietly " +
          "accumulating NaNs, and those buffers were what got written to the " +
          "checkpoint and what validation was scored against. The model was " +
          "learning and the number watching it was broken.",
        "I only caught it by trying to warm-start the next run from the saved " +
          "checkpoint. Even with mixed precision explicitly disabled, the first " +
          "batch produced NaN losses, which is not something a clean run does. " +
          "The corruption had been serialized into the file itself. The fix was " +
          "to throw that checkpoint away, restart from clean pretrained " +
          "weights, and leave mixed precision off. It defaults to off in the " +
          "repository now, with a comment pointing at this incident so the next " +
          "person does not spend a week on it.",
      ],
    },
    {
      kind: "figureGrid",
      heading: "Labels against predictions",
      media: [
        {
          src: "/images/pavescan/val_batch0_labels.webp",
          alt: "Ground-truth defect outlines drawn on a grid of validation pavement photographs",
          width: 1200,
          height: 1200,
          caption: "Ground truth",
        },
        {
          src: "/images/pavescan/val_batch0_pred.webp",
          alt: "The model's predicted defect masks on the same grid of validation pavement photographs",
          width: 1200,
          height: 1200,
          caption: "Predicted",
        },
      ],
    },
    {
      kind: "callout",
      heading: "What this does not do yet",
      tone: "limitation",
      body: [
        `Detection is the strong half. Box detection reaches ${f.boxMap.value} ` +
          `mAP50 while mask quality sits at ${f.maskMap.value}, and that gap is ` +
          "real rather than a reporting artifact. The model finds defects " +
          "reliably and traces their exact outline poorly, especially on thin " +
          "branching cracks, where it under-segments and sometimes splits one " +
          "crack into several detections. This is a working detector, not a " +
          "finished segmenter, and the scoring treats it that way.",
        "The scoring also carries an assumption I would rather not need. " +
          "Potholes are counted, and a count is exactly what the standard asks " +
          "for. Crack quantities are a detection count multiplied by an assumed " +
          "extent per detection, derived from the survey's own sampling " +
          "geometry rather than chosen to make the number look good. Scaling " +
          "that assumption from half to double moves the final score by about " +
          `${f.extentSensitivity.value}. That is the honest residual: a 52 point ` +
          "arbitrary control was traded for a 12 point disclosed assumption, " +
          "which is better, but it is not nothing.",
        "Nothing here claims ASTM compliance. The scorer reproduces the " +
          "standard's published worked example and its scoring chain, and a " +
          "certified inspector's survey is still the reference. The test that " +
          "would settle it is correlation against inspector-scored ground truth " +
          "on a route where both exist, and that route has not been driven yet.",
      ],
    },
    {
      kind: "prose",
      heading: "Where it goes",
      body: [
        "The correlation test is what matters next, because until a route is " +
          "scored both ways this system is internally consistent and externally " +
          "unproven. The harness for it is written and tested against planted " +
          "ground truth. It needs footage.",
        "After that, measurement from the image, so one pass returns both a " +
          "condition score and enough geometry to plan a repair against. The " +
          "original plan used a drone. That got dropped in favour of a dashcam, " +
          "which is cheaper, legal everywhere, and already mounted on vehicles " +
          "that drive these roads every day.",
      ],
    },
  ],
};
