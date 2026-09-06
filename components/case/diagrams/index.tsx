import type { DiagramId } from "@/content/types";
import { pipelines } from "@/content/pipelines";
import styles from "./Diagram.module.css";

export function Diagram({ id }: { id: DiagramId }) {
  const pipeline = pipelines[id];
  return <div className={styles.pipeline} role="group" aria-label={pipeline.label}>
    {pipeline.lanes.map((lane, index) => <div className={styles.lane} key={lane.title ?? index}>
      {lane.title && <h3 className={styles.laneTitle}>{lane.title}</h3>}
      <ol className={styles.steps}>{lane.steps.map((step, stepIndex) => {
        const Title = lane.title ? "h4" : "h3";
        return <li key={step.title}><span className={styles.number} aria-hidden="true">{stepIndex + 1}</span><div><Title className={styles.stepTitle}>{step.title}</Title><p>{step.detail}</p></div></li>;
      })}</ol>
    </div>)}
  </div>;
}
