import { PaveScanWorkVisual } from "./PaveScanWorkVisual";
import { CivicWorkVisual } from "./CivicWorkVisual";
import { LocalFlowWorkVisual } from "./LocalFlowWorkVisual";
import { ChapelWorkVisual } from "./ChapelWorkVisual";

export function ProjectWorkVisual({ slug, compact = false }: { slug: string; compact?: boolean }) {
  switch (slug) {
    case "pavescan-ai": return <PaveScanWorkVisual compact={compact} />;
    case "civic-data-pipeline": return <CivicWorkVisual compact={compact} />;
    case "localflow": return <LocalFlowWorkVisual compact={compact} />;
    case "pop-up-chapel": return <ChapelWorkVisual compact={compact} />;
    default: return null;
  }
}
