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
    {
      kind: "prose",
      heading: "Why I built it",
      body: [
        "I liked using a commercial dictation tool, but wanted to keep my " +
          "voice on my own machine and avoid another subscription. I also " +
          "wanted control over how much it changed my wording.",
        "I connected models that run locally and measured how quickly my PC " +
          "returned the text. I then worked on the wait after releasing the " +
          "key, what happens when a model fails, and how much cleanup to allow.",
      ],
    },
    {
      kind: "prose",
      heading: "How it works",
      body: [
        "Hold Right Shift and talk. When you release it, Whisper turns the " +
          "speech into text on the graphics processor. A small language model " +
          "on the same processor cleans it up, then the app pastes it at the " +
          "cursor. Right Alt gives the same text without punctuation, which I " +
          "use in a command-line terminal. Double-tapping either key keeps " +
          "recording on, so I do not have to hold it through a long paragraph.",
        "The cleanup model uses the active app's program name as a style " +
          "hint: casual for chat, more like an email in an email app. " +
          "It uses only that executable name, not screenshots or other app content.",
        "A personal dictionary helps with names the speech model gets wrong. " +
          "It corrects close matches to my saved spelling, such as changing " +
          "\"versal\" to \"Vercel\".",
      ],
    },
    {
      kind: "callout",
      heading: "Keep the words I actually said",
      tone: "note",
      body: [
        "The first version cleaned up aggressively. It cut filler, resolved " +
          "spoken self-corrections, and generally made me sound better than I " +
          "had. It was also the version I trusted least, because I could not " +
          "tell from the output what I had actually said.",
        "So the default changed to keep almost exactly what I said: remove the ums, fix the " +
          "punctuation, keep every real word. The heavier cleanup is still " +
          "there behind a setting. With lighter cleanup, I can compare the output " +
          "with what I remember saying, instead of trying to spot an unexpected rewrite.",
        "There are backups for each step. If the speech model on the graphics " +
          "processor fails, another runs on the main processor (CPU). If the " +
          "cleanup model is unavailable, simple text rules take over. The " +
          "result may be slower or less polished, but the words are still available.",
      ],
    },
    {
      kind: "callout",
      heading: "Limits I still work around",
      tone: "limitation",
      body: [
        "Supported languages depend on the speech model. The graphics-processor " +
          "version uses Whisper; the Parakeet backup supports a different set. " +
          "This test does not tell me how accurate it is across languages or accents.",
        "Windows blocks pasting into apps running as administrator unless " +
          "LocalFlow also has that permission. Some terminals ignore pasted " +
          "text, so the tool types it character by character there. These are workarounds.",
        "The automated tests feed recordings directly into the software, " +
          "bypassing the microphone. The error rate and wait time come from a " +
          "fixed test on one PC and graphics processor. They do not measure " +
          "microphone quality or tell us how other hardware will perform.",
        "The app saves both raw and cleaned text in a local history file. " +
          "Keeping speech off a cloud service still leaves that record on the PC.",
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      body: [
        "I use it every day, including for a good share of the writing that " +
          "went into this site. Personal use helps me find awkward behaviour between " +
          "the benchmark runs; it does not replace those measurements.",
      ],
    },
  ],
};
