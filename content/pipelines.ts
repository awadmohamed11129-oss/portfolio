import type { DiagramId } from "./types";

type Pipeline = {
  readonly label: string;
  readonly lanes: readonly {
    readonly title?: string;
    readonly steps: readonly { readonly title: string; readonly detail: string }[];
  }[];
};

export const pipelines: Record<DiagramId, Pipeline> = {
  "pavescan-pipeline": {
    label: "PaveScan processing sequence",
    lanes: [{ steps: [
      { title: "Sample the footage", detail: "Take frames by travelled distance and attach the available GPS positions." },
      { title: "Find candidates", detail: "Combine crack segmentation and road-damage detection within the road surface." },
      { title: "Keep uncertainty", detail: "Flag possible shadows and utility covers alongside the model findings." },
      { title: "Merge nearby sightings", detail: "Keep source images and observations attached to each reviewable record." },
      { title: "Estimate and report", detail: "Exclude utility-cover suspects from scoring, estimate condition from density, and generate maps and a report." },
    ] }],
  },
  "civic-pipeline": {
    label: "Two paths through the public civic data",
    lanes: [
      { title: "Mobility datasets", steps: [
        { title: "Read the source", detail: "Stream public files and feeds. Check the fields, dates, units, and missing values." },
        { title: "Model what is there", detail: "Separate dated events from reference records. Preserve meaningful missing values." },
        { title: "Deliver for review", detail: "Produce consistent records, source documentation, samples, and contract tests." },
      ] },
      { title: "311 service requests", steps: [
        { title: "Align the archive", detail: "Reconcile category names and identify missing periods in the historical data." },
        { title: "Compare carefully", detail: "Calculate trends and hotspots against explicit comparison periods." },
        { title: "Explain the output", detail: "Package the signals in JSON with documented definitions and caveats." },
      ] },
    ],
  },
  "chapel-pipeline": {
    label: "Booking to document workflow",
    lanes: [{ steps: [
      { title: "Read one booking", detail: "Validate names, dates, package choices, and vendor information against the input schema." },
      { title: "Prepare the wording", detail: "Generate variable copy with deterministic fallback wording when the model service is unavailable." },
      { title: "Apply the templates", detail: "Place the booking information in the branded document layouts." },
      { title: "Render the documents", detail: "Export the day-of document set for review. Intake and access controls remain separate work." },
    ] }],
  },
};

