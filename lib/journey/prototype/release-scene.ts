import * as THREE from "three";
export function releaseScene(scene: THREE.Scene): void {
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    resources.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      resources.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) resources.add(value);
    }
  });
  for (const resource of resources) resource.dispose();
  scene.clear();
}
