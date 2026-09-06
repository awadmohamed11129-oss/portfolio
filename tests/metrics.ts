import type { Page } from '@playwright/test';

export async function worldMetrics(page: Page, reset = false): Promise<Record<string, unknown>> {
  return page.evaluate(resetSamples => new Promise<Record<string, unknown>>((resolve, reject) => {
    const timeout = window.setTimeout(() => { window.removeEventListener('portfolio:world-metrics', receive); reject(new Error('World metrics event did not answer within 2 seconds')); }, 2000);
    function receive(event: Event) {
      window.clearTimeout(timeout);
      window.removeEventListener('portfolio:world-metrics', receive);
      resolve((event as CustomEvent<Record<string, unknown>>).detail);
    }
    window.addEventListener('portfolio:world-metrics', receive);
    window.dispatchEvent(new CustomEvent('portfolio:metrics-request', { detail: { reset: resetSamples } }));
  }), reset);
}

export async function independentFrames(page: Page, milliseconds: number) {
  return page.evaluate(duration => new Promise<{ intervals: number[]; p95: number; p99: number; maximum: number; stallsOver100ms: number }>(resolve => {
    const started = performance.now();
    const intervals: number[] = [];
    let previous = 0;
    function frame(now: number) {
      if (previous) intervals.push(now - previous);
      previous = now;
      if (now - started < duration) requestAnimationFrame(frame);
      else {
        const sorted = [...intervals].sort((a, b) => a - b);
        const percentile = (q: number) => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] || 0;
        resolve({ intervals, p95: percentile(.95), p99: percentile(.99), maximum: sorted.at(-1) || 0, stallsOver100ms: intervals.filter(interval => interval > 100).length });
      }
    }
    requestAnimationFrame(frame);
  }), milliseconds);
}
