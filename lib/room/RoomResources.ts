import { BufferGeometry, Material, Object3D, Texture } from "three";

/** Per-load ownership, including objects that resolve after another dependency fails. */
export class RoomResources {
  private resources = new Set<BufferGeometry | Material | Texture>();
  private freed = new WeakSet<object>();
  private closedImages = new WeakSet<object>();
  private disposed = false;

  own<T extends BufferGeometry | Material | Texture>(resource: T): T {
    if ((resource as Material).isMaterial) {
      for (const value of Object.values(resource)) if (value && typeof value === "object" && (value as Texture).isTexture) this.own(value as Texture);
    }
    if (this.disposed) this.free(resource);
    else this.resources.add(resource);
    return resource;
  }

  capture(value: unknown) {
    if (!value || typeof value !== "object") return;
    const typed = value as { isTexture?: boolean; isMaterial?: boolean; isBufferGeometry?: boolean; isObject3D?: boolean };
    if (typed.isTexture || typed.isMaterial || typed.isBufferGeometry) this.own(value as Texture | Material | BufferGeometry);
    if (typed.isObject3D) (value as Object3D).traverse(object => {
      const mesh = object as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      if (mesh.geometry) this.own(mesh.geometry);
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) this.own(material);
    });
  }

  private free(resource: BufferGeometry | Material | Texture) {
    if (this.freed.has(resource)) return;
    this.freed.add(resource);
    resource.dispose();
    if ((resource as Texture).isTexture) {
      const texture = resource as Texture;
      const images: unknown[] = Array.isArray(texture.image) ? texture.image : [texture.image];
      for (const image of images) {
        if (!image || typeof image !== "object" || this.closedImages.has(image)) continue;
        const bitmap = image as { close?: () => void };
        if (typeof bitmap.close === "function") { this.closedImages.add(image); bitmap.close(); }
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const resource of this.resources) this.free(resource);
    this.resources.clear();
  }
}
