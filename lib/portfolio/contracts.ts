import type { Group, Object3D } from "three";

export const DESTINATIONS = ["home", "projects", "experience", "about", "resume", "contact"] as const;
export type DestinationId = (typeof DESTINATIONS)[number];
export type InteractionMode = "world" | "content" | "device";
export type DeviceId = "monitor" | "phone";
export type AnchorId = "toronto" | "clouds" | "earth" | "projects" | "experience" | "neighbourhood" | "house" | "room" | DeviceId;
export type Vec3 = readonly [number, number, number];
export type CameraAnchor = { position: Vec3; target: Vec3; fov?: number };
export type NavigationOptions = { mode?: InteractionMode; replace?: boolean };
export type DeviceState = { id: DeviceId; expanded: boolean };
export type RoomTarget = { id: DeviceId; object: Object3D; anchor: CameraAnchor; width: number; height: number };
/** Room coordinates are local; World transforms anchors through group.matrixWorld. */
export type RoomSceneHandle = {
  group: Group;
  anchors: Partial<Record<AnchorId, CameraAnchor>>;
  targets: RoomTarget[];
  update?: (elapsedSeconds: number, deltaSeconds: number) => void;
  dispose: () => void;
};
export type RoomSceneOptions = { quality: "low" | "high"; signal?: AbortSignal };
export type AssetRecord = {
  id: string;
  src: string;
  kind: "gltf" | "texture" | "image" | "data";
  stage: "initial" | "about";
  bytes: number;
  credit: string;
  license: string;
};
export type AssetManifest = { version: 1; revision: string; assets: readonly AssetRecord[] };
export const DESTINATION_PATHS: Record<DestinationId, string> = { home: "/", projects: "/projects", experience: "/experience", about: "/about", resume: "/resume", contact: "/contact" };
export function destinationForPath(path: string): DestinationId {
  const pathname = path.split(/[?#]/, 1)[0];
  if (pathname === "/projects" || pathname.startsWith("/projects/")) return "projects";
  if (pathname === "/experience") return "experience";
  if (pathname === "/about") return "about";
  if (pathname === "/resume") return "resume";
  if (pathname === "/contact") return "contact";
  return "home";
}
export function destinationForFragment(hash: string): DestinationId | null {
  const fragments: Record<string, DestinationId> = { "#projects": "projects", "#experience": "experience", "#about": "about", "#skills": "experience", "#resume": "resume", "#contact": "contact" };
  return fragments[hash] ?? null;
}
