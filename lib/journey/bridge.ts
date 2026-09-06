import type { WorldStageHandle } from './stage';
let current: WorldStageHandle | undefined;
let unavailable = false;
let listeners: Array<{ resolve: (stage: WorldStageHandle) => void; reject: (error: Error) => void }> = [];
export function getWorldStage() { return current; }
export function worldUnavailable() { return unavailable; }
export function whenWorldStage(): Promise<WorldStageHandle> {
  if (unavailable) return Promise.reject(new Error('World unavailable'));
  return current ? Promise.resolve(current) : new Promise((resolve, reject) => listeners.push({ resolve, reject }));
}
export function publishWorldStage(stage: WorldStageHandle) {
  current = stage;
  unavailable = false;
  for (const listener of listeners) listener.resolve(stage);
  listeners = [];
}
export function markWorldUnavailable() {
  unavailable = true;
  current = undefined;
  for (const listener of listeners) listener.reject(new Error('World unavailable'));
  listeners = [];
  window.dispatchEvent(new Event('stage:unavailable'));
}
export function releaseWorldStage(stage: WorldStageHandle) { if (current === stage) current = undefined; }
