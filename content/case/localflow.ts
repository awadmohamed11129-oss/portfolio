import type { CaseStudy } from "../types";
import { localflow as f } from "../facts";

/**
 * LocalFlow.
 *
 * New page, added 2026-08-24 on Mohamad's call. Source of every claim is
 * `C:\Garage\wispr-clone` (README.md, DECISIONS.md, bench/accuracy-2026-07-25/).
 * That repository is READ ONLY for this campaign.
 *
 * Note on which numbers appear here. The README carries two measurement eras:
 * 0.95% WER / 638 ms from 2026-07-08 on the old CPU engine, and 3.5% / 939 ms
 * from 2026-08-19 on the current GPU engine. This page quotes the current
 * build, which is the slower and less flattering pair. Do not swap in the older
 * numbers; they describe an engine that no longer runs.
 */
export const localflowCase: CaseStudy = {
  slug: "localflow",
  title: "LocalFlow",
  eyebrow: "Personal tool, 2026",
  summary:
    "Hold a key, speak, and cleaned-up text appears at the cursor. " +
    "I built this Windows dictation tool to run on my own PC, without " +
    "a subscription or sending my voice to a cloud service.",
  metaDescription:
    "Voice dictation for Windows that transcribes and cleans up speech on my PC: " +
    `${f.wer.value} word error rate, ` +
    `${f.latency.value} average wait for text, ${f.cost.value} against the ` +
    `${f.replaces.value} subscription it replaced.`,
  links: [],
  linkNote: "A personal Windows tool, with no public download on this page. The figures below come from an August 19, 2026 test on my PC's graphics processor (GPU).",
  overview: [
    { label: "My contribution", value: "Connecting speech models, cleaning up text and inserting it into Windows apps" },
    { label: "Runs on", value: "My Windows PC, using local speech and language models" },
    { label: "Evidence", value: "Recorded tests on one graphics processor; daily personal use" },
  ],
  stack: [
    {
      label: "Speech and language",
      items: [
        "whisper.cpp (Vulkan)",
        "Whisper large-v3-turbo q8",
        "Qwen3-4B-Instruct",
        "llama.cpp",
        "faster-whisper",
        "Parakeet TDT",
      ],
    },
    { label: "Application", items: ["Python 3.12", "PySide6", "Qt", "pytest", "Windows APIs"] },
  ],
  blocks: [
    {
      kind: "stat",
      heading: "The August test on my PC",
      items: [
        { label: "Word error rate", fact: f.wer, note: "Counts missed, added and incorrect words against the reference transcript" },
        { label: "Average wait for text", fact: f.latency, note: "From releasing the key to text appearing on screen" },
        { label: "Faster than using the CPU", fact: f.speedup, note: "Compared with running speech recognition on the main processor" },
        { label: "Subscription and service fees", fact: f.cost, note: "Excludes hardware and electricity" },
      ],
      note: "Measured August 19, 2026 on one Windows PC using its graphics processor and a fixed set of recordings. These results apply to that setup. The test did not use the microphone.",
    },
    { kind: "prose", heading: "Why I built it", body: [
      "I wanted dictation without a subscription, with my voice staying on my PC and more control over changes to my wording. I connected local speech and language models to a Windows app that types where my cursor is.",
    ] },
    { kind: "prose", heading: "How it works", body: [
      "Hold Right Shift, speak, then release. Whisper transcribes the recording, a small language model cleans up the text, and the app pastes it at the cursor. Double-tap to keep recording without holding the key.",
      "A personal dictionary helps with names. The active app's program name guides the writing style; the tool does not read screenshots or app content. Right Alt gives unpunctuated text for terminals.",
    ] },
    { kind: "callout", heading: "Keeping my words", tone: "note", body: [
      "Early versions rewrote too much. The default now removes filler and fixes punctuation while keeping my real words. Stronger cleanup is optional.",
      "If a model fails, backup speech recognition or simple text rules take over. The result may be slower or less polished, but I still get my words.",
    ] },
    { kind: "callout", heading: "Limits", tone: "limitation", body: [
      "The benchmark uses saved recordings on one PC, bypassing the microphone. It does not establish performance on other hardware, across accents or in other languages.",
      "Pasting into administrator apps needs matching permissions. Some terminals need text typed character by character. Raw and cleaned transcripts are saved locally, so private speech still leaves a record on the PC.",
    ] },
    { kind: "prose", heading: "Where it stands", body: [
      "I use it every day, including for some of the writing on this site. It is a personal tool with no public download.",
    ] },
  ],
};
