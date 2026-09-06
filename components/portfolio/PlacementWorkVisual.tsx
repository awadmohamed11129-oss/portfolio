import { civic } from "@/content/facts";
import styles from "./PlacementWorkVisual.module.css";

/** A documented placement check, not a reconstruction of private client data. */
export function PlacementWorkVisual() {
  return <figure className={styles.visual} data-placement-visual>
    <ol className={styles.flow} aria-label="How I worked with the data">
      <li><span className={styles.flowMark} aria-hidden="true">1</span><div><strong>Collect</strong><span>Toronto’s public mobility and service-request records</span></div></li>
      <li><span className={styles.flowMark} aria-hidden="true">2</span><div><strong>Check</strong><span>Dates, missing values, and what a trend actually measures</span></div></li>
      <li><span className={styles.flowMark} aria-hidden="true">3</span><div><strong>Deliver</strong><span>Consistent data, automated tests, and source notes for review</span></div></li>
    </ol>
    <div className={styles.example}>
      <h3>One check changed the story.</h3>
      <p className={styles.context}>Growth in one Toronto 311 service-request category</p>
      <div className={styles.comparison} aria-label={`Apparent growth ${civic.covidReported.value}; corrected growth ${civic.covidReal.value}`}>
        <div className={styles.barRow}>
          <div><span>Before checking</span><strong>{civic.covidReported.value}</strong></div>
          <div className={styles.track} aria-hidden="true"><span className={styles.beforeBar} style={{ width: civic.covidReported.value }} /></div>
        </div>
        <div className={styles.barRow}>
          <div><span>After correcting the baseline</span><strong>{civic.covidReal.value}</strong></div>
          <div className={styles.track} aria-hidden="true"><span className={styles.afterBar} style={{ width: civic.covidReal.value }} /></div>
        </div>
      </div>
      <p className={styles.explanation}>Pandemic-era months recorded as zero made the earlier comparison period look too low. Accounting for those gaps brought the growth figure down to {civic.covidReal.value}. A reporting gap does not establish that no real activity occurred.</p>
    </div>
    <figcaption>Illustration of a documented placement finding using public 311 data. These percentages describe a reporting correction, not a business result. No client records are shown.</figcaption>
  </figure>;
}
