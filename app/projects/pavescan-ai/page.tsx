/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, FileText } from "lucide-react";
import { GithubIcon } from "@/components/BrandIcons";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "PaveScan AI",
  description:
    "YOLO11 instance segmentation plus ASTM D6433 PCI scoring for pavement inspection. Streamlit dashboard, Folium GPS map, and printable PDF reports from a single image upload.",
};

const techStack = [
  "Python 3.10",
  "YOLO11l (Ultralytics)",
  "Streamlit",
  "Folium",
  "ASTM D6433",
  "Roboflow datasets",
  "ReportLab",
];

const dashboardTour = [
  {
    src: "/images/pavescan/dashboard-upload.png",
    alt: "Streamlit upload page with four sample crack images shown as thumbnails",
    caption:
      "Upload — drag-and-drop the four sample crack images; thumbnails confirm what's about to be scored.",
  },
  {
    src: "/images/pavescan/dashboard-detection.png",
    alt: "Streamlit detection page showing six per-image defect detections with severity badges",
    caption:
      "Detection — six defects across four images, four flagged Critical with severity badges and confidence.",
  },
  {
    src: "/images/pavescan/dashboard-map.png",
    alt: "Streamlit Folium map plotting GPS-tagged inspection markers near the University of Toronto",
    caption:
      "Map — Folium GPS pins coloured by severity, plotted near U of T.",
  },
  {
    src: "/images/pavescan/dashboard-report.png",
    alt: "Streamlit report page with PCI score 67 / Fair, class breakdown, and downloadable PDF",
    caption:
      "Report — final PCI score (67 / Fair) with class breakdown and downloadable PDF.",
  },
];

const charts = [
  {
    src: "/images/pavescan/results.png",
    alt: "Training and validation loss plus mAP curves over 200 epochs",
    caption: "Loss and mAP curves, 200 epochs",
  },
  {
    src: "/images/pavescan/confusion_matrix.png",
    alt: "Segmentation confusion matrix across pavement-defect classes",
    caption: "Class confusion matrix",
  },
  {
    src: "/images/pavescan/BoxPR_curve.png",
    alt: "Box detection precision-recall curve",
    caption: "Box detection precision-recall",
  },
  {
    src: "/images/pavescan/MaskPR_curve.png",
    alt: "Mask segmentation precision-recall curve",
    caption: "Mask segmentation precision-recall",
  },
];

export default function PaveScanPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <section className="mb-16 sm:mb-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Project · 2026
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
          PaveScan AI
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A pavement-inspection model that reads photos and scores the surface
          against the ASTM D6433 Pavement Condition Index. Packaged as a
          Streamlit dashboard with a sample PDF report.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="https://github.com/awadmohamed11129-oss/pavescan-ai"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            <GithubIcon className="mr-1.5 h-4 w-4" />
            View source on GitHub
          </a>
          <a
            href="/pdfs/pavescan-sample-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download sample report
          </a>
        </div>
        <figure className="mt-12">
          <img
            src="/images/pavescan/val_batch0_pred.jpg"
            alt="Validation-batch grid showing model-predicted instance masks on held-out pavement photos"
            className="w-full rounded-lg border border-border/50"
          />
          <figcaption className="mt-3 text-sm text-muted-foreground">
            Validation predictions on a held-out set, V2 fine-tune. YOLO11l
            instance segmentation; each colour is a separate detected defect
            instance.
          </figcaption>
        </figure>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          The problem
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Pavement Condition Index surveys are still done by trained inspectors
          walking the surface, sketching defects, and tabulating deduct values
          by hand against ASTM D6433. The standard works fine — the bottleneck
          is how long it takes per kilometre, and the cost adds up fast at the
          network scale a municipality has to cover. A model that can read a
          photo and produce the same scoring inputs changes the cost of the
          survey, not the standard behind the score.
        </p>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What I built
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-8">
          PaveScan AI is a Python pipeline. A YOLO11 instance-segmentation
          model, fine-tuned on labelled pavement-defect images, produces
          per-defect class IDs and pixel masks. Those masks feed an ASTM D6433
          scoring routine that returns a PCI value plus per-defect deduct
          values. A Streamlit dashboard wraps the upload-to-report flow, a
          Folium map plots GPS-tagged inspections, and a ReportLab module
          generates the printable PDF you can download above.
        </p>
        <div className="rounded-lg border border-border/50 bg-card/30 p-4 sm:p-6 overflow-x-auto">
          <svg
            viewBox="0 0 1400 380"
            role="img"
            aria-labelledby="pipeline-title pipeline-desc"
            preserveAspectRatio="xMidYMid meet"
            className="w-full min-w-[700px] text-foreground"
            style={{
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            }}
          >
            <title id="pipeline-title">PaveScan AI pipeline</title>
            <desc id="pipeline-desc">
              Pavement image upload feeds a YOLO11 segmentation model, which
              produces per-defect class and mask data. The masks are scored
              against ASTM D6433 to compute a PCI value. The score then drives
              three outputs: a Streamlit dashboard, a GeoJSON plus Folium map,
              and a PDF report.
            </desc>
            <defs>
              <marker
                id="pipeline-arrow"
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
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="20" y="145" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="300" y="145" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="580" y="145" width="240" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="860" y="145" width="240" height="70" rx="8" strokeOpacity="0.95" strokeWidth="2" />
              <rect x="1160" y="20" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="1160" y="145" width="220" height="70" rx="8" strokeOpacity="0.55" />
              <rect x="1160" y="270" width="220" height="70" rx="8" strokeOpacity="0.55" />
            </g>
            <g fill="currentColor" fontSize="14" textAnchor="middle">
              <text x="130" y="184">Pavement image upload</text>
              <text x="410" y="184">YOLO11 segmentation</text>
              <text x="700" y="184">Per-defect class + mask</text>
              <text x="980" y="184" fontWeight="600">ASTM D6433 PCI scoring</text>
              <text x="1270" y="59">Streamlit dashboard</text>
              <text x="1270" y="184">GeoJSON + Folium map</text>
              <text x="1270" y="309">PDF report</text>
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#pipeline-arrow)">
              <path d="M240 180 L300 180" />
              <path d="M520 180 L580 180" />
              <path d="M820 180 L860 180" />
              <path d="M1100 180 L1130 180 L1130 55 L1160 55" />
              <path d="M1100 180 L1160 180" />
              <path d="M1100 180 L1130 180 L1130 305 L1160 305" />
            </g>
          </svg>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Dashboard tour
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl mb-8">
          Four pages, one upload-to-PCI flow. Real model output from a sample
          of four pavement crack images.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {dashboardTour.map((page) => (
            <figure
              key={page.src}
              className="rounded-lg border border-border/60 bg-card/30 overflow-hidden"
            >
              <div className="relative aspect-[16/10] w-full bg-secondary">
                <Image
                  src={page.src}
                  alt={page.alt}
                  fill
                  sizes="(min-width: 640px) 480px, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="px-4 py-3 text-sm text-foreground/80 leading-relaxed">
                {page.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Tech stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="h-7 text-sm font-normal px-3"
            >
              {t}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Results
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 mb-6">
          {charts.map((c) => (
            <figure
              key={c.src}
              className="rounded-lg border border-border/50 bg-card/30 p-3"
            >
              <img src={c.src} alt={c.alt} className="w-full rounded-md" />
              <figcaption className="mt-2 text-xs text-muted-foreground text-center">
                {c.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 border-l-4 border-l-primary/70 bg-card/40 p-6">
          <p className="text-base sm:text-lg flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-[family-name:var(--font-fraunces)] text-2xl sm:text-3xl font-medium">
              Box mAP50 0.816
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-[family-name:var(--font-fraunces)] text-2xl sm:text-3xl font-medium">
              Mask mAP50 0.395
            </span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            V2 fine-tune on YOLO11l, 200 epochs. Box detection is the strong
            part. Pixel-perfect mask segmentation on thin, branching cracks is
            where the next round of work goes.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          An honest read of the predictions
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <figure className="rounded-lg border border-border/50 bg-card/30 p-3">
            <img
              src="/images/pavescan/val_batch0_labels.jpg"
              alt="Ground-truth defect labels for the validation batch"
              className="w-full rounded-md"
            />
            <figcaption className="mt-2 text-xs text-muted-foreground text-center">
              Ground-truth labels
            </figcaption>
          </figure>
          <figure className="rounded-lg border border-border/50 bg-card/30 p-3">
            <img
              src="/images/pavescan/val_batch0_pred.jpg"
              alt="Model-predicted defect masks on the same validation batch"
              className="w-full rounded-md"
            />
            <figcaption className="mt-2 text-xs text-muted-foreground text-center">
              Model predictions
            </figcaption>
          </figure>
        </div>
        <p className="mt-6 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Predictions match the labels well on big, high-contrast defects.
          The model still under-segments thin and branching cracks, and
          sometimes splits one defect into a few separate detections. The
          0.395 mask mAP50 is honest: this is a working detector, not a
          finished segmenter, and the next training round should focus there.
        </p>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What broke during V2 training: silent EMA corruption from AMP
        </h2>
        <div className="space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          <p>
            The V2 fine-tune ran on YOLO11l at 1280-pixel input resolution,
            with aggressive augmentation and focal loss to push recall on the
            harder defect classes. Around sixty epochs in, training loss kept
            trending down on paper, but validation mAP went flat and{" "}
            <code className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.9em] text-primary/90">best.pt</code>{" "}
            stopped improving — well before any reasonable convergence point.
          </p>
          <p>
            The model itself was fine. The exponential-moving-average buffers
            were not. Mixed-precision training was on by default. At 1280 px
            with aggressive augmentation and focal loss, the loss surface
            produced occasional non-finite gradients that AMP&apos;s loss
            scaler absorbed without raising. The live model kept training on
            rescaled gradients fine, but the EMA buffers were quietly
            accumulating NaN values, and those NaNs got serialized into the
            checkpoint every epoch. Validation mAP, computed against the EMA
            weights, naturally went nowhere.
          </p>
          <p>
            I caught it when I tried to warm-start the next run from the
            saved checkpoint to save time. Even with{" "}
            <code className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.9em] text-primary/90">amp=False</code>{" "}
            set explicitly, the run produced NaN losses on the first batch —
            not a training problem, just the corrupted EMA buffers loading
            back in. The fix: drop the bad checkpoint, load a clean
            Ultralytics-pretrained YOLO11l weight, set{" "}
            <code className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.9em] text-primary/90">amp=False</code>{" "}
            from the start, and write off the corrupted run as an
            unrecoverable cost.
          </p>
          <p>
            The lesson: on long training runs with high-resolution inputs and
            aggressive loss configurations, AMP is not free. It can quietly
            corrupt checkpoints in a way that&apos;s expensive to recover
            from. For V2 onward, AMP defaults to off in this repo, with a
            single comment pointing back at this incident.
          </p>
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          Sample PDF report
        </h2>
        <a
          href="/pdfs/pavescan-sample-report.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card/30 px-5 py-4 max-w-md transition-colors hover:border-border hover:bg-card/60"
        >
          <FileText className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              pavescan-sample-report.pdf
            </div>
            <div className="text-xs text-muted-foreground">
              ASTM D6433 PCI scoring output, smoke-test build
            </div>
          </div>
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight mb-5">
          What&apos;s next
        </h2>
        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Module 2 is planned but not yet built — orthomosaic stitching and
          on-image measurements so a single survey produces both PCI and
          surface geometry. A custom drone capture rig was on the original
          roadmap and has been shelved in favour of dashcam capture for now.
        </p>
      </section>

      <section className="border-t border-border/40 pt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to home
        </Link>
        <a
          href="https://github.com/awadmohamed11129-oss/pavescan-ai"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <GithubIcon className="mr-1.5 h-4 w-4" />
          View on GitHub
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </a>
      </section>
    </article>
  );
}
