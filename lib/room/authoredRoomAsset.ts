import { ClampToEdgeWrapping, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { RoomResources } from "./RoomResources";

export const ROOM_ASSETS = {
  high: { model: "/room/models/room-corner-high.glb", info: "/room/models/room-corner-high.json" },
  low: { model: "/room/models/room-corner-low.glb", info: "/room/models/room-corner-low.json" },
} as const;

export type RoomAssetInfo = { stage: "corner" | "full"; bakedIndirect: boolean; lightmap: { uvChannel: 1; directBaked: false; colorBaked: false; encoding: "srgb-normalized-indirect-v1"; gain: number } };

export async function loadAuthoredRoom(quality: "high" | "low", resources: RoomResources, signal?: AbortSignal): Promise<{ gltf: GLTF; info: RoomAssetInfo }> {
  let rejectAbort: ((reason: unknown) => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const onAbort = () => { resources.dispose(); rejectAbort?.(signal?.reason ?? new DOMException("Room load aborted", "AbortError")); };
  signal?.addEventListener("abort", onAbort, { once: true });
  const loader = new GLTFLoader();
  // Dependency capture also covers partial parses and late ImageBitmap arrivals.
  loader.register(parser => {
    const getDependency = parser.getDependency.bind(parser);
    parser.getDependency = async (type, index) => {
      const value: unknown = await getDependency(type, index);
      if (type === "texture" && !value) throw new Error(`Required room texture ${index} failed to decode`);
      resources.capture(value);
      return value;
    };
    return { name: "ROOM_RESOURCE_OWNERSHIP", beforeRoot: async () => {
      if (parser.json.images?.some((image: { uri?: string }) => image.uri)) throw new Error("Room textures must be embedded in the cancellable GLB request");
      await parser.getDependencies("texture");
    } };
  });
  try {
    if (signal?.aborted) { resources.dispose(); throw signal.reason ?? new DOMException("Room load aborted", "AbortError"); }
    const infoPromise = fetch(ROOM_ASSETS[quality].info, { signal }).then(async response => {
      if (!response.ok) throw new Error(`Room descriptor unavailable (${response.status})`);
      const info = await response.json() as RoomAssetInfo;
      if (!["corner", "full"].includes(info.stage) || typeof info.bakedIndirect !== "boolean" || info.lightmap?.uvChannel !== 1 || info.lightmap.directBaked !== false || info.lightmap.colorBaked !== false || info.lightmap.encoding !== "srgb-normalized-indirect-v1" || !Number.isFinite(info.lightmap.gain) || info.lightmap.gain < 1) throw new Error("Room bake descriptor does not match the material contract");
      return info;
    });
    const modelPromise = fetch(ROOM_ASSETS[quality].model, { signal }).then(async response => {
      if (!response.ok) throw new Error(`Room model unavailable (${response.status})`);
      return loader.parseAsync(await response.arrayBuffer(), "/room/models/");
    }).then(gltf => { resources.capture(gltf.scene); return gltf; });
    const [gltf, info] = await Promise.race([Promise.all([modelPromise, infoPromise]), aborted]);
    if (signal?.aborted) { resources.dispose(); throw signal.reason ?? new DOMException("Room load aborted", "AbortError"); }
    adaptRoomMaterials(gltf, info, quality);
    return { gltf, info };
  } catch (error) { resources.dispose(); throw error; }
  finally { signal?.removeEventListener("abort", onAbort); }
}

/** The glTF AO slot transports the separate IndirectUV image; it is never used as AO. */
export function adaptRoomMaterials(gltf: GLTF, info: RoomAssetInfo, quality: "high" | "low") {
  const adapted = new Set<MeshStandardMaterial>();
  gltf.scene.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mesh.castShadow = materials.every(material => !material.transparent);
    mesh.receiveShadow = true;
    for (const candidate of materials) {
      const material = candidate as MeshStandardMaterial;
      if (!material.isMeshStandardMaterial) continue;
      for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) if (texture) texture.anisotropy = quality === "high" ? 4 : 2;
      if (material.userData.room_indirect_carrier) {
        if (info.bakedIndirect && !mesh.geometry.hasAttribute("uv1")) throw new Error("Room indirect map is missing TEXCOORD_1");
        if (adapted.has(material)) continue;
        if (!material.aoMap) throw new Error("Required room indirect carrier is missing");
        const indirect = material.aoMap;
        material.aoMap = null;
        if (info.bakedIndirect) {
          indirect.colorSpace = SRGBColorSpace;
          indirect.channel = 1;
          indirect.wrapS = indirect.wrapT = ClampToEdgeWrapping;
          material.lightMap = indirect;
          material.lightMapIntensity = info.lightmap.gain;
        }
        adapted.add(material);
      }
      material.needsUpdate = true;
    }
  });
}
