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
    "Voice dictation that runs entirely on my own machine. Hold a key, talk, " +
    "release, and cleaned-up text lands at the cursor in whatever app is in " +
    "front of me. I built it because I did not want to pay a subscription to " +
    "send my voice somewhere else.",
  metaDescription:
    "Fully local voice dictation for Windows: speech to text on the GPU, an " +
    `on-device language model for cleanup, ${f.wer.value} word error rate at ` +
    `${f.latency.value} mean latency, ${f.cost.value} against the ` +
    `${f.replaces.value} subscription it replaced.`,
  links: [],
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
      heading: "Measured on my own machine",
      items: [
        { label: "Word error rate", fact: f.wer },
        { label: "Mean latency", fact: f.latency, note: "hotkey release to text on screen" },
        { label: "Faster than the CPU path", fact: f.speedup },
        { label: "Running cost", fact: f.cost, note: `replaces a ${f.replaces.value} subscription` },
      ],
    },
    {
      kind: "prose",
      heading: "Why I built it",
      body: [
        "I was using a commercial dictation tool and liked it enough to notice " +
          "what it cost me. Fifteen dollars a month is the small part. The " +
          "larger part is that it streams your audio to someone else's servers, " +
          "and to work out what you are writing about it also captures " +
          "screenshots of your screen. I write job applications and client work " +
          "on this machine.",
        "So the requirement was not to build something cleverer. It was to " +
          "build the same experience with nothing leaving the machine, and to " +
          "find out whether consumer hardware was finally good enough to make " +
          "that a real option rather than a compromise.",
      ],
    },
    {
      kind: "prose",
      heading: "How it works",
      body: [
        "Hold the right shift key and talk. On release, the audio goes to a " +
          "Whisper model running on the GPU, the transcript goes to a small " +
          "language model running on the same GPU for cleanup, and the result " +
          "is pasted at the cursor. Holding right alt instead gives the same " +
          "text without punctuation, which is what I want in a terminal. Double " +
          "tapping either key locks recording on so I do not have to hold " +
          "anything through a long paragraph.",
        "The cleanup model gets a hint about which application is in focus, so " +
          "dictating into a chat app produces something casual and dictating " +
          "into an email client produces something that reads like an email. " +
          "That hint is derived from the executable name and nothing else. It " +
          "never looks at the screen, which is precisely the behaviour I was " +
          "trying to get away from.",
        "There is also a personal dictionary, because general speech models " +
          "have no idea what my proper nouns are. Near-miss transcriptions snap " +
          "to the spelling I actually use, which is how \"versal\" learned to " +
          "become \"Vercel\".",
      ],
    },
    {
      kind: "callout",
      heading: "The decision I keep having to defend to myself",
      tone: "note",
      body: [
        "The first version cleaned up aggressively. It cut filler, resolved " +
          "spoken self-corrections, and generally made me sound better than I " +
          "had. It was also the version I trusted least, because I could not " +
          "tell from the output what I had actually said.",
        "So the default changed to near-verbatim: remove the ums, fix the " +
          "punctuation, keep every real word. The heavier cleanup is still " +
          "there behind a setting. It turns out the useful property of a " +
          "dictation tool is not that it improves your speech, it is that you " +
          "can stop proofreading it, and that only holds while it is not " +
          "quietly rewriting you.",
        "The same reasoning drove the fallback chain. If the GPU speech model " +
          "is unavailable it drops to a CPU one, and if the language model is " +
          "unavailable the cleanup falls back to plain pattern matching. Every " +
          "layer degrades to something worse rather than to nothing, because a " +
          "dictation tool that occasionally loses a sentence is not a dictation " +
          "tool.",
      ],
    },
    {
      kind: "callout",
      heading: "What it does not do",
      tone: "limitation",
      body: [
        "It handles English and about two dozen European languages, against " +
          "the hundred or so the commercial tool supports. For me that is " +
          "irrelevant. For most people it would not be.",
        "Windows blocks pasting into elevated windows unless the tool is " +
          "elevated too, and some terminal interfaces swallow a paste, so those " +
          "targets get typed character by character instead. Both are worked " +
          "around rather than solved.",
        "The automated tests inject audio below the microphone layer, so they " +
          "prove the pipeline rather than the microphone. The quoted error rate " +
          "and latency come from a fixed bench on one machine with one GPU. " +
          "They are honest numbers for this setup and I would not present them " +
          "as a benchmark of anything broader.",
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      body: [
        "I use it every day, including for a good share of the writing that " +
          "went into this site. That is the real test, and it is the reason the " +
          "limitations above are written from experience rather than from a " +
          "test report.",
      ],
    },
  ],
};
