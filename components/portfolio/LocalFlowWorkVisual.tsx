"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import styles from "./LocalFlowWorkVisual.module.css";

// Exact contiguous excerpt from utt2_scripts_1_2.final in the saved bench.
// Provenance and presentation limits: docs/qa/work-visuals/localflow-source.md.
const SAVED_OUTPUT =
  "I'm testing my dictation tool today, and I wanted to catch every single word I say, yesterday I sent three emails, two messages, and one report before noon, does it handle questions properly?";

type Stage = "speech" | "processing" | "cursor" | "complete";

const STATUS: Record<Stage, string> = {
  speech: "Replaying the saved speech-to-text workflow.",
  processing: "Illustrating local speech recognition and cleanup.",
  cursor: "Showing the saved output at the cursor.",
  complete: "Saved test excerpt displayed in full.",
};

export function LocalFlowWorkVisual({ compact = false }: { compact?: boolean }) {
  const [output, setOutput] = useState(SAVED_OUTPUT);
  const [stage, setStage] = useState<Stage>("complete");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playing = stage !== "complete";

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finishOnReducedMotion = () => {
      if (!motion.matches) return;
      if (timer.current !== null) clearTimeout(timer.current);
      setOutput(SAVED_OUTPUT);
      setStage("complete");
    };
    motion.addEventListener("change", finishOnReducedMotion);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      motion.removeEventListener("change", finishOnReducedMotion);
    };
  }, []);

  function replay() {
    if (timer.current !== null) clearTimeout(timer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOutput(SAVED_OUTPUT);
      setStage("complete");
      return;
    }

    setOutput("");
    setStage("speech");
    // Presentation pacing only: these delays are not benchmark measurements.
    timer.current = setTimeout(() => {
      setStage("processing");
      timer.current = setTimeout(() => {
        setStage("cursor");
        const words = SAVED_OUTPUT.split(" ");
        let count = 0;
        const reveal = () => {
          count += 1;
          setOutput(words.slice(0, count).join(" "));
          if (count < words.length) timer.current = setTimeout(reveal, 45);
          else setStage("complete");
        };
        reveal();
      }, 450);
    }, 450);
  }

  return (
    <figure
      className={`${styles.visual} ${compact ? styles.compact : ""}`}
      data-work-visual="localflow"
      data-stage={stage}
      aria-label="LocalFlow saved dictation demonstration"
    >
      <div className={styles.workflow}>
        <ol aria-label="Dictation workflow">
          <li data-active={stage === "speech"}>
            <span className={styles.stepName}>Speak</span>
            <span className={styles.stepDetail}>Hold <kbd>Right Shift</kbd></span>
          </li>
          <li data-active={stage === "processing"}>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
            <span className={styles.stepName}>Process locally</span>
            <span className={styles.stepDetail}>Speech + cleanup</span>
          </li>
          <li data-active={stage === "cursor" || stage === "complete"}>
            <ArrowRight className={styles.arrow} aria-hidden="true" />
            <span className={styles.stepName}>Keep writing</span>
            <span className={styles.stepDetail}>Text at your cursor</span>
          </li>
        </ol>
      </div>

      <div className={styles.paper} aria-busy={playing}>
        <div className={styles.editorHeading}>
          <span>Untitled note</span>
          <span className={styles.insertLabel}>Inserted by LocalFlow</span>
        </div>
        <div className={styles.textArea}>
          <p className={styles.spaceKeeper} aria-hidden="true">{SAVED_OUTPUT}<span className={styles.cursor} /></p>
          <p className={styles.output} data-testid="localflow-output">
            {output}<span className={styles.cursor} aria-hidden="true" />
          </p>
        </div>
        <div className={styles.editorFoot}>
          <span className={styles.localMark} aria-hidden="true" />
          <span>Speech and cleanup run on the same PC.</span>
        </div>
      </div>

      <figcaption className={styles.caption}>
        <p>Reconstructed demonstration.<br />Saved test excerpt; illustrative replay timing.</p>
        <button type="button" onClick={replay} disabled={playing}>
          <RotateCcw size={14} aria-hidden="true" />
          Replay saved output
        </button>
      </figcaption>
      <span className={styles.srOnly} role="status">{STATUS[stage]}</span>
    </figure>
  );
}
