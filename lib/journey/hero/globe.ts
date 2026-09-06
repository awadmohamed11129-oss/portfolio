// The globe and space stage: a lit Earth (NASA Blue Marble day, Black Marble
// night lights, procedural clouds, an ocean-only specular) under a procedural
// deep sky. Its own renderer; it fades in under the ground stage.
//
// The sky is one shader: a dense carpet of faint stars in three sizes, a few
// bright ones, and a milky way with fine dust structure. It has no texture to
// download and no pixel size to run out of, and because it has structure at
// every scale, the slow rotation of the camera at rest changes most of the
// frame — which is what "still alive when you stop" measures.
import * as THREE from "three";
import { releaseScene } from "../prototype/release-scene";

import { EARTH_RADIUS_KM, FOV_DEG } from "./math";
import type { BodyId, PlanetSpec } from './bodies/types';

const DAY_TEXTURE = "/media/earth/day-4096.webp";
const NIGHT_TEXTURE = "/media/earth/night-4096.webp";
const ROUGHNESS_TEXTURE = "/media/earth/roughness-1024.webp";
const SKY_RADIUS_KM = 190_000;

const NOISE_GLSL = `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
  vec3 hash3(vec3 p) {
    return vec3(hash(p), hash(p + 17.31), hash(p + 41.77));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i), n100 = hash(i + vec3(1,0,0)), n010 = hash(i + vec3(0,1,0)), n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1)), n101 = hash(i + vec3(1,0,1)), n011 = hash(i + vec3(0,1,1)), n111 = hash(i + vec3(1,1,1));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
  float fbm4(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + 3.7; a *= 0.5; }
    return v;
  }
`;

/** The sky sphere: stars and the milky way, all procedural. `uPixelsPerRadian`
 *  keeps star discs a fixed size on screen whatever the viewport. */
function makeSky(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    uniforms: { uPixelsPerRadian: { value: 1_300 }, uBandNormal: { value: new THREE.Vector3(0, 1, 0) }, uNebula: { value: 1 }, uStars: { value: 1 } },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform float uPixelsPerRadian;
      uniform vec3 uBandNormal;
      uniform float uNebula;
      uniform float uStars;
      ${NOISE_GLSL}

      // One lattice of stars: a cell either holds a star or not; the star sits
      // near the cell centre and is drawn as a soft disc of a given pixel radius.
      vec3 starLayer(vec3 d, float cells, float keep, float radiusPx, float gain) {
        vec3 cell = floor(d * cells);
        vec3 h = hash3(cell);
        if (h.x > keep) return vec3(0.0);
        vec3 centre = (cell + 0.5 + (hash3(cell + 5.3) - 0.5) * 0.55) / cells;
        float angle = length(d - normalize(centre));
        float px = angle * uPixelsPerRadian;
        float disc = exp(-(px * px) / (radiusPx * radiusPx));
        float mag = pow(h.y, 5.0) * 0.9 + 0.1;
        float warm = h.z;
        vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.9, 0.74), warm);
        return tint * disc * mag * gain;
      }

      void main() {
        vec3 d = normalize(vDir);
        // The milky way is the great circle normal to uBandNormal; the world
        // points it so the band crosses the wide shot behind the planet.
        float lat = abs(dot(d, uBandNormal));
        float core = exp(-lat * lat * 24.0);
        float glow = exp(-lat * lat * 6.0) * 0.4;
        float cloud = fbm4(d * 6.0) * 0.45 + fbm4(d * 19.0) * 0.3 + fbm4(d * 45.0) * 0.25;
        // The band is not a glow but a weave: bright knots between dark dust
        // lanes, structured down to the width of a finger on the screen.
        float lanes = smoothstep(0.22, 0.78, fbm4(d * 22.0 + 11.0) * 0.6 + fbm4(d * 70.0 + 5.0) * 0.4);
        float dust = smoothstep(0.3, 0.75, fbm4(d * 9.0 + 31.0) * 0.7 + fbm4(d * 38.0 + 5.0) * 0.3);
        float milk = (core * (0.3 + 0.7 * lanes) + glow * cloud * (0.5 + 0.5 * lanes)) * (1.0 - 0.8 * dust * core);
        // Faint nebulosity everywhere, mottled, richest near the band.
        float fine = fbm4(d * 40.0 + 3.0);
        float haze = 0.014 + 0.03 * fbm4(d * 3.0 + 21.0) + 0.045 * fine * fine * (0.4 + 1.4 * glow);
        vec3 colour = mix(vec3(0.5, 0.58, 0.9), vec3(1.0, 0.86, 0.68), cloud * 0.6 + core * 0.4) * milk * 0.4
          + vec3(0.5, 0.58, 0.82) * haze * (0.7 + 0.8 * milk);
        // Stars: a faint carpet, a sparser middle population, a few bright ones.
        vec3 stars = starLayer(d, 560.0, 0.45, 0.95, 0.32)
          + starLayer(d, 230.0, 0.22, 1.3, 0.8)
          + starLayer(d, 80.0, 0.16, 1.9, 1.25);
        // The band is where most stars are; away from it the sky goes quiet.
        stars *= 0.5 + 0.9 * exp(-lat * lat * 3.0);
        gl_FragColor = vec4(colour * uNebula + stars * uStars, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS_KM, 48, 32), material);
  mesh.renderOrder = 10;
  mesh.userData.material = material;
  return mesh;
}

function makeAtmosphere(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorld = normalize((modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorld;
      uniform vec3 uSun;
      void main() {
        float rim = pow(max(0.0, 0.74 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
        float lit = clamp(dot(vWorld, uSun) * 1.4 + 0.5, 0.04, 1.0);
        gl_FragColor = vec4(vec3(0.24, 0.55, 1.0) * lit, rim * 0.7 * lit);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS_KM * 1.032, 96, 64), material);
  mesh.userData.material = material;
  return mesh;
}

function makeClouds(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSun: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vWorld = normalize((modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uSun;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) { value += amplitude * noise(p); p = p * 2.03 + 7.1; amplitude *= 0.5; }
        return value;
      }
      void main() {
        vec2 drift = vec2(uTime * 0.0015, -uTime * 0.0003);
        vec2 p = vUv * vec2(30.0, 15.0) + drift;
        float cover = fbm(p) * 0.6 + fbm(p * 3.7 + 4.0) * 0.4;
        // Thin, streaky cover: mostly clear with fronts, never a blanket.
        float cloud = smoothstep(0.56, 0.8, cover) * (0.6 + 0.4 * fbm(p * 0.35 + 9.0));
        float lit = clamp(dot(vWorld, uSun) * 1.6 + 0.35, 0.02, 1.0);
        gl_FragColor = vec4(vec3(0.94, 0.96, 1.0) * lit, cloud * 0.3);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS_KM * 1.006, 96, 64), material);
  mesh.userData.material = material;
  return mesh;
}

export class GlobeStage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 0.02, 400_000);
  private readonly earth = new THREE.Group();
  private readonly sky = makeSky();
  private readonly clouds = makeClouds();
  private readonly atmosphere = makeAtmosphere();
  private readonly sun = new THREE.DirectionalLight(0xfff4e6, 3.0);
  private readonly sunView = { value: new THREE.Vector3(1, 0, 0) };
  private readonly readyPromise: Promise<void>;
  private ready = false;
  private disposed = false;
  private readonly pendingTextures = new Set<THREE.Texture>();
  private renderScale: number;
  private surface: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhysicalMaterial> | null = null;
  private earthMaterial: THREE.MeshPhysicalMaterial | null = null;
  private bodyId: BodyId = 'earth';
  private rings: THREE.Mesh<THREE.RingGeometry, THREE.MeshStandardMaterial> | null = null;
  private composition = 0;
  private bodyReveal = 1;

  constructor(canvas: HTMLCanvasElement, renderScale: number) {
    this.renderScale = renderScale;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setClearColor(0x020307, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.add(this.sky, this.earth);
    // The night side stays dark: only a whisper of sky light so the limb reads.
    this.scene.add(new THREE.HemisphereLight(0x8fb4e6, 0x0a1220, 0.14));
    // Late afternoon over the Atlantic: Toronto lit, the terminator on the far side.
    this.sun.position.set(-9_000, 5_500, 26_000);
    this.scene.add(this.sun);
    const sunDirection = this.sun.position.clone().normalize();
    (this.atmosphere.userData.material as THREE.ShaderMaterial).uniforms.uSun.value.copy(sunDirection);
    (this.clouds.userData.material as THREE.ShaderMaterial).uniforms.uSun.value.copy(sunDirection);
    this.resize();
    this.readyPromise = this.loadEarth();
  }

  private async loadEarth(): Promise<void> {
    const loader = new THREE.TextureLoader();
    const load = async (url: string): Promise<THREE.Texture> => {
      const texture = await loader.loadAsync(url);
      if (this.disposed) texture.dispose();
      else this.pendingTextures.add(texture);
      return texture;
    };
    const [day, night, roughness] = await Promise.all([
      load(DAY_TEXTURE),
      load(NIGHT_TEXTURE),
      load(ROUGHNESS_TEXTURE),
    ]);
    if (this.disposed) return;
    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    day.anisotropy = anisotropy;
    night.anisotropy = anisotropy;
    const material = new THREE.MeshPhysicalMaterial({
      map: day,
      emissiveMap: night,
      emissive: new THREE.Color(0xffc987),
      emissiveIntensity: 1.1,
      roughnessMap: roughness,
      roughness: 1,
      metalness: 0,
      specularIntensity: 0.28,
    });
    // City lights belong to the night side only: scale the emissive by how far
    // each fragment faces away from the sun (sun direction in view space). The
    // ocean glint is kept soft: the roughness map never drops under 0.55.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSunView = this.sunView;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", ["#include <common>", "uniform vec3 uSunView;"].join("\n"))
        .replace(
          "#include <roughnessmap_fragment>",
          ["#include <roughnessmap_fragment>", "roughnessFactor = max(roughnessFactor, 0.55);"].join("\n"),
        )
        .replace(
          "#include <emissivemap_fragment>",
          [
            "#include <emissivemap_fragment>",
            "totalEmissiveRadiance *= 1.0 - smoothstep(-0.24, 0.08, dot(normalize(vNormal), uSunView));",
          ].join("\n"),
        );
    };
    const surface = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS_KM, 128, 96), material);
    this.surface = surface;
    this.earthMaterial = material;
    this.earth.add(surface, this.clouds, this.atmosphere);
    this.pendingTextures.clear();
    // Pay for the shaders and the 4096 px uploads now, behind the road, not
    // on the frame the planet first appears (measured: two 190 ms hitches).
    await this.renderer.compileAsync(this.scene, this.camera);
    if (this.disposed) return;
    for (const texture of [day, night, roughness]) this.renderer.initTexture(texture);
    this.ready = true;
  }

  /** Point the milky way so that, from the wide shot over `restDirection`
   *  (the unit vector from the planet's centre to the camera), the band runs
   *  diagonally across the frame and passes behind the planet's upper-left
   *  limb rather than hiding behind it. */
  orientSky(restDirection: THREE.Vector3): void {
    const view = restDirection.clone().negate().normalize();
    const right = new THREE.Vector3().crossVectors(view, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, view).normalize();
    const along = right.clone().multiplyScalar(Math.cos(0.6)).addScaledVector(up, Math.sin(0.6)).normalize();
    const centre = view.clone().addScaledVector(right, -0.2).addScaledVector(up, 0.2).normalize();
    const normal = new THREE.Vector3().crossVectors(centre, along).normalize();
    (this.sky.userData.material as THREE.ShaderMaterial).uniforms.uBandNormal.value.copy(normal);
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  isReady(): boolean {
    return this.ready;
  }

  async prepareBody(spec: PlanetSpec): Promise<THREE.MeshPhysicalMaterial> {
    const load = async (url: string, color = false) => {
      const request = new AbortController();
      const deadline = setTimeout(() => request.abort(), 15_000);
      let blob: Blob;
      try {
        const response = await fetch(url, { signal: request.signal });
        if (!response.ok) throw new Error(`Planet texture ${response.status}: ${url}`);
        blob = await response.blob();
      } finally { clearTimeout(deadline); }
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY', colorSpaceConversion: 'none' });
      const texture = new THREE.Texture(bitmap);
      texture.needsUpdate = true;
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      if (this.disposed) { bitmap.close(); texture.dispose(); throw new Error('Stage disposed'); }
      return texture;
    };
    const results = await Promise.allSettled([load(spec.map, true), spec.displacementMap ? load(spec.displacementMap) : undefined,
      spec.ringMap ? load(spec.ringMap, true) : undefined]);
    const textures = results.map(result => result.status === 'fulfilled' ? result.value : undefined);
    const releaseTextures = () => {
      for (const texture of textures) if (texture) { texture.dispose(); (texture.image as ImageBitmap)?.close?.(); }
    };
    const failed = results.find(result => result.status === 'rejected');
    if (failed?.status === 'rejected') { releaseTextures(); throw failed.reason; }
    const [map, displacement, ringTexture] = textures;
    const brightness = spec.brightness ?? (spec.id === 'saturn' ? 1.1 : 1.65);
    const material = new THREE.MeshPhysicalMaterial({ map, color: new THREE.Color(brightness, brightness, brightness), displacementMap: displacement ?? null, displacementScale: spec.displacementScaleKm,
      displacementBias: -spec.displacementScaleKm * .5, bumpMap: displacement ?? null, bumpScale: 2.4, roughness: 1, metalness: 0, specularIntensity: .08 });
    material.userData.ringTexture = ringTexture;
    // Compile the actual material against this stage's lights before it is visible.
    // The temporary mesh shares geometry; it never joins the rendered scene.
    const preview = new THREE.Mesh(this.surface!.geometry, material);
    try {
      // Upload and compile before the swap; a failed GPU upload must release
      // decoded bitmaps just as a failed request or shader compilation does.
      for (const texture of [map, displacement, ringTexture]) if (texture) this.renderer.initTexture(texture);
      await this.renderer.compileAsync(preview, this.camera, this.scene);
      if (this.disposed) throw new Error('Stage disposed');
    } catch (error) { releaseTextures(); material.dispose(); throw error; }
    return material;
  }

  setBody(spec: PlanetSpec | null, material?: THREE.MeshPhysicalMaterial): void {
    if (!this.surface || !this.earthMaterial) return;
    const previous = this.surface.material;
    if (this.rings) {
      this.rings.removeFromParent(); this.rings.geometry.dispose(); this.rings.material.dispose(); this.rings = null;
    }
    this.surface.material = spec ? material! : this.earthMaterial;
    this.bodyId = spec?.id ?? 'earth';
    this.surface.scale.set(1, spec?.polarScale ?? (this.bodyId === 'saturn' ? .9 : 1), 1);
    if (spec?.id === 'saturn' && material?.userData.ringTexture) {
      const inner = EARTH_RADIUS_KM * 1.24, outer = EARTH_RADIUS_KM * 2.28;
      const geometry = new THREE.RingGeometry(inner, outer, 256);
      const positions = geometry.attributes.position, uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) uv.setXY(i, (Math.hypot(positions.getX(i), positions.getY(i)) - inner) / (outer - inner), .5);
      geometry.rotateX(-Math.PI / 2);
      const ringMaterial = new THREE.MeshStandardMaterial({ map: material.userData.ringTexture, side: THREE.DoubleSide,
        transparent: true, alphaTest: .025, depthWrite: false, roughness: 1, metalness: 0, color: 0xd2c7b0 });
      // The planet's shadow falls across its rings, without another shadow map.
      ringMaterial.onBeforeCompile = shader => {
        shader.uniforms.uRingSun = { value: new THREE.Vector3(...spec.sunDir).normalize() };
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRingPoint;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRingPoint = position;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRingPoint; uniform vec3 uRingSun;')
          .replace('#include <opaque_fragment>', `float t = max(0.0, -dot(vRingPoint, uRingSun));
            float clearance = length(vRingPoint + t * uRingSun) / ${EARTH_RADIUS_KM.toFixed(1)};
            outgoingLight *= mix(.12, 1.0, smoothstep(.94, 1.04, clearance));\n#include <opaque_fragment>`);
      };
      this.rings = new THREE.Mesh(geometry, ringMaterial);
      this.earth.add(this.rings);
    }
    const skyMaterial = this.sky.userData.material as THREE.ShaderMaterial;
    skyMaterial.uniforms.uNebula.value = spec ? .22 : 1;
    skyMaterial.uniforms.uStars.value = spec ? .65 : 1;
    if (previous !== this.earthMaterial && previous !== material) {
      for (const texture of new Set([previous.map, previous.displacementMap, previous.userData.ringTexture as THREE.Texture | undefined])) if (texture) { texture.dispose(); (texture.image as ImageBitmap)?.close?.(); }
      previous.dispose();
    }
    this.clouds.visible = spec?.clouds ?? true;
    this.atmosphere.visible = spec?.atmosphere ?? true;
    this.sun.position.set(...(spec?.sunDir ?? [-9000, 5500, 26000]));
    this.renderer.toneMappingExposure = spec?.exposure ?? 1.05;
  }

  setComposition(amount: number, reveal = 1): void { this.composition = amount; this.bodyReveal = reveal; }

  /** A prototype can leave while textures or shader compilation are pending. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ready = false;
    // Clouds/atmosphere join the scene only after textures arrive.
    if (!this.clouds.parent) this.scene.add(this.clouds);
    if (!this.atmosphere.parent) this.scene.add(this.atmosphere);
    releaseScene(this.scene);
    for (const texture of this.pendingTextures) texture.dispose();
    this.pendingTextures.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  resize(renderScale = this.renderScale): void {
    this.renderScale = renderScale;
    const height = Math.max(1, Math.round(window.innerHeight * this.renderScale));
    this.renderer.setSize(Math.max(1, Math.round(window.innerWidth * this.renderScale)), height, false);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    (this.sky.userData.material as THREE.ShaderMaterial).uniforms.uPixelsPerRadian.value = height / ((FOV_DEG * Math.PI) / 180);
  }

  /** `position` and `up` come from the world's damped camera; this stage only
   *  looks and draws. */
  render(position: THREE.Vector3, up: THREE.Vector3, altitudeKm: number, timeSeconds: number, motion: boolean): void {
    this.camera.position.copy(position);
    this.camera.up.copy(up);
    this.camera.lookAt(0, 0, 0);
    // Keep the body beside the reading column, with the phone's body above it.
    const phone = window.innerWidth <= 1023;
    const width = window.innerWidth, height = window.innerHeight;
    if (this.composition) this.camera.setViewOffset(width, height, phone ? 0 : -width * .23 * this.composition,
      phone ? height * .26 * this.composition : 0, width, height);
    else this.camera.clearViewOffset();
    this.earth.visible = this.bodyReveal > .001;
    this.earth.scale.setScalar(this.bodyReveal);
    this.camera.updateMatrixWorld();
    this.sunView.value.copy(this.sun.position).normalize().transformDirection(this.camera.matrixWorldInverse);
    const near = Math.min(2, Math.max(0.02, altitudeKm * 0.2));
    if (Math.abs(this.camera.near - near) / this.camera.near > 0.2) {
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
    }
    this.sky.rotation.y = motion ? timeSeconds * 0.0025 : 0;
    (this.clouds.userData.material as THREE.ShaderMaterial).uniforms.uTime.value = motion ? timeSeconds : 0;
    this.renderer.render(this.scene, this.camera);
  }
}
