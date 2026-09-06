"use client";

import { useId, useState } from "react";
import { civic } from "@/content/facts";
import styles from "./CivicWorkVisual.module.css";

const examples = {
  cameras: {
    label: "Cameras",
    title: "Keep the location. Don’t invent a date.",
    source: "Traffic cameras",
    fields: [["Location", "Present"], ["Date", "Unavailable"]],
    decision: "Without a real date, a row cannot say when an event happened.",
    output: "Reference table",
    result: "Camera locations are kept for lookups, not as dated event records.",
    evidence: "An automated test checks that cameras stay out of the event records.",
  },
  volumes: {
    label: "Traffic counts",
    title: "Missing speed stays missing.",
    source: "Traffic-count survey",
    fields: [["Vehicle count", "Measured"], ["Speed", "Not measured"]],
    decision: "Only record a speed if the survey actually measured it.",
    output: "null",
    result: "Here, null means no speed was measured. It does not mean zero speed.",
    evidence: "The count remains usable without fabricating a speed.",
  },
  trends: {
    label: "311 trends",
    title: "Check the story behind the rise.",
    source: "311 request history",
    fields: [["Reported growth", civic.covidReported.value], ["Baseline", "Missing periods"]],
    decision: "Correct the comparison for missing periods.",
    output: civic.covidReal.value,
    result: "Corrected growth in recorded service requests.",
    evidence: "A reporting trend alone cannot establish its cause.",
  },
} as const;

type Example = keyof typeof examples;

/** Public case-study rules, illustrated with conceptual fields; no client rows. */
export function CivicWorkVisual({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<Example>("cameras");
  const id = useId();
  const example = examples[selected];

  return (
    <section
      className={`${styles.visual} ${compact ? styles.compact : ""}`}
      data-work-visual="civic-data-pipeline"
      aria-label="Explore Civic Data Pipeline engineering decisions"
    >
      <div className={styles.inner}>
        <div className={styles.controls} role="group" aria-label="Choose a documented data rule">
          {(Object.keys(examples) as Example[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={selected === key}
              aria-controls={`${id}-example`}
              onClick={() => setSelected(key)}
            >
              {examples[key].label}
            </button>
          ))}
        </div>

        <div id={`${id}-example`} aria-live="polite" aria-atomic="true">
          <h3 className={styles.title}>{example.title}</h3>
          <ol className={styles.flow} aria-label="Source to usable output">
            <li className={styles.source}>
              <div className={styles.stage}>
                <span className={styles.dot} aria-hidden="true" />
                <span>Source</span>
              </div>
              <div className={styles.sourceBody}>
                <p className={styles.sourceName}>{example.source}</p>
                <dl className={styles.fields}>
                  {example.fields.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>

            <li className={styles.decision}>
              <div className={styles.stage}>
                <svg className={styles.gate} viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 1 19 10 10 19 1 10Z" />
                  <path d="m6.5 10 2.2 2.2 4.8-4.8" />
                </svg>
                <span>Decision</span>
              </div>
              <p>{example.decision}</p>
            </li>

            <li className={styles.output}>
              <div className={styles.stage}>
                <span className={`${styles.dot} ${styles.outputDot}`} aria-hidden="true" />
                <span>Output</span>
              </div>
              <div className={styles.resultBody}>
                {selected === "trends" ? (
                  <div className={styles.comparison} aria-label="Reported growth 85 percent; corrected growth 32 percent">
                    <div className={styles.barRow}>
                      <span>Reported</span>
                      <span className={styles.barTrack} aria-hidden="true">
                        <span className={styles.reportedBar} style={{ width: civic.covidReported.value }} />
                      </span>
                      <strong>{civic.covidReported.value}</strong>
                    </div>
                    <div className={`${styles.barRow} ${styles.corrected}`}>
                      <span>Corrected</span>
                      <span className={styles.barTrack} aria-hidden="true">
                        <span className={styles.correctedBar} style={{ width: civic.covidReal.value }} />
                      </span>
                      <strong>{civic.covidReal.value}</strong>
                    </div>
                  </div>
                ) : (
                  <p className={`${styles.resultName} ${selected === "volumes" ? styles.null : ""}`}>
                    {selected === "cameras" && (
                      <svg className={styles.tableIcon} viewBox="0 0 32 32" aria-hidden="true">
                        <rect x="3" y="5" width="26" height="22" rx="2" />
                        <path d="M3 12h26M3 19h26M12 12v15" />
                      </svg>
                    )}
                    {example.output}
                  </p>
                )}
                <p className={styles.resultNote}>{example.result}</p>
              </div>
            </li>
          </ol>
          <p className={styles.evidence}>{example.evidence}</p>
        </div>
        <p className={styles.caption}>
          Illustration of the documented data checks. These are examples, not client records or a live system.
        </p>
      </div>
    </section>
  );
}
