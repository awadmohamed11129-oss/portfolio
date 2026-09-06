// The ground stage: road → town → city → country, as a flat, DEM-displaced
// mosaic of real imagery of the real route, looked at straight down. Its own
// renderer and canvas; it fades out under the globe and is disposed after.
//
// Tiles are self-hosted under /media/ground (scripts/fetch_ground_tiles.mjs):
// City of Toronto orthophoto z13–20 (z21 was a server upsample), NASA Landsat WELD z9–12, NASA Blue
// Marble z5–8, plus a 3×3 Mapzen terrarium DEM at z11 for the relief. Only
// tiles inside the view are requested; layers crossfade so a zoom change or a
// change of source never pops.
import * as THREE from "three";

import { FOV_DEG, groundZoom, mercatorFraction, tileWidthMetres } from "./math";

const TILE_SEGMENTS = 16;
/** The self-hosted store holds ±STORE_HALF_X × ±STORE_HALF_Y tiles around the
 *  anchor at every zoom (scripts/fetch_ground_tiles.mjs); never ask past it. */
const STORE_HALF_X = 3.1;
const STORE_HALF_Y = 2.05;
const MIN_ZOOM = 5;
const MAX_ZOOM = 20;
const TERRAIN_ZOOM = 11;
const TERRAIN_EXAGGERATION = 1.6;
const TERRAIN_MAX_ZOOM = 17;
const LAYER_FADE_PER_SECOND = 5;
const TILE_FADE_PER_SECOND = 7;
/** Layers this far from the active zoom give their GPU memory back. */
const KEEP_ZOOM_RANGE = 2;
/** Tiles released per frame once a layer is gone (about a millisecond). */
const DISPOSE_TILES_PER_FRAME = 24;
/** Tile textures uploaded to the GPU per frame (each is a 256 px WebP). */
const UPLOADS_PER_FRAME = 6;

type Source = { id: string; minZoom: number; maxZoom: number };
const SOURCES: Source[] = [
  { id: "toronto", minZoom: 13, maxZoom: 20 },
  { id: "landsat", minZoom: 9, maxZoom: 12 },
  { id: "bmng", minZoom: 5, maxZoom: 8 },
];

/** Tone per zoom so the three sources dissolve into each other: the city ortho
 *  was flown on an overcast noon and is bright and grey; Landsat is dark. The
 *  road is held down to the site's asphalt-black palette, the city steps down
 *  to meet Landsat, and every step is small enough to hide in a layer fade. */
function gradeFor(zoom: number): [number, number, number] {
  if (zoom === 13) return [0.6, 0.66, 0.6];
  if (zoom === 14) return [0.68, 0.73, 0.68];
  if (zoom === 15) return [0.74, 0.77, 0.75];
  if (zoom === 16) return [0.78, 0.8, 0.8];
  if (zoom >= 17) return [0.8, 0.81, 0.83];
  if (zoom >= 9 && zoom <= 12) return [1.18, 1.16, 1.1];
  return [1, 1, 1];
}

function sourceFor(zoom: number): Source {
  return SOURCES.find((s) => zoom >= s.minZoom && zoom <= s.maxZoom) ?? SOURCES[SOURCES.length - 1];
}

type Tile = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>;
  centreX: number;
  centreY: number;
  state: "idle" | "loading" | "ready" | "missing";
  reveal: number;
};

type Layer = {
  zoom: number;
  group: THREE.Group;
  widthKm: number;
  tiles: Map<string, Tile>;
  opacity: number;
  wanted: boolean;
  displaced: boolean;
};

type Dem = { data: Float32Array; size: number; originX: number; originY: number; datum: number };

function releaseTexture(texture: THREE.Texture): void {
  texture.dispose();
  (texture.image as ImageBitmap | undefined)?.close?.();
}

async function bitmap(url: string): Promise<ImageBitmap | null> {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  if (!(response.headers.get("content-type") ?? "").startsWith("image/")) return null;
  // ImageBitmap ignores three's flipY; the flip has to happen here or every
  // tile renders upside down and the mosaic shows its rows as bands.
  return createImageBitmap(await response.blob(), { colorSpaceConversion: "none", imageOrientation: "flipY" });
}

export class GroundStage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 0.005, 3_000);
  private readonly layers = new Map<number, Layer>();
  private readonly fraction = new Map<number, { x: number; y: number }>();
  private dem: Dem | null = null;
  private demPromise: Promise<void> | null = null;
  private activeZoom = -1;
  private asleep = false;
  private disposed = false;
  private readonly disposeQueue: Layer[] = [];
  private readonly uploadQueue: Array<{ tile: Tile; texture: THREE.Texture; material: THREE.MeshLambertMaterial; layer: Layer; key: string }> = [];
  private renderScale: number;
  private aspect = 1;
  private renderWidth = 1;
  private lastAltitude = Infinity;
  private lastOffsetX = 0;
  private lastOffsetY = 0;
  private groundEndKm = 620;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly lat: number,
    private readonly lon: number,
    renderScale: number,
  ) {
    this.renderScale = renderScale;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setClearColor(0x05070b, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Imagery carries its own shadows; the lights only lift the relief.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa4b0, 2.55));
    const sun = new THREE.DirectionalLight(0xfff2dc, 0.9);
    sun.position.set(-0.55, 0.7, 0.45);
    this.scene.add(sun);
    this.camera.up.set(0, 1, 0);
    this.resize();
    this.demPromise = this.loadDem();
  }

  resize(renderScale = this.renderScale): void {
    this.renderScale = renderScale;
    this.renderWidth = Math.max(1, Math.round(window.innerWidth * this.renderScale));
    const height = Math.max(1, Math.round(window.innerHeight * this.renderScale));
    this.renderer.setSize(this.renderWidth, height, false);
    this.aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  zoomFor(altitudeKm: number): number {
    return groundZoom(altitudeKm, this.aspect, this.renderWidth, this.lat, MIN_ZOOM, MAX_ZOOM);
  }

  /** Resolve once every tile in view at this altitude has arrived, so the film
   *  can open on a finished frame. */
  setCeiling(altitudeKm: number): void {
    this.groundEndKm = altitudeKm;
  }

  /** A descent is coming: start the tiles for the destination altitude and
   *  the two zooms above it now, while the camera is still far up. */
  warm(altitudeKm: number): void {
    if (this.asleep) this.wake();
    const zoom = this.zoomFor(altitudeKm);
    for (let z = zoom; z >= Math.max(MIN_ZOOM, zoom - 2); z -= 1) this.request(this.layer(z), altitudeKm * 2 ** (zoom - z), 0, 0);
  }

  async prepare(altitudeKm: number): Promise<void> {
    if (altitudeKm >= this.groundEndKm) return;
    const zoom = this.zoomFor(altitudeKm);
    const layer = this.layer(zoom);
    this.request(layer, altitudeKm, 0, 0);
    await this.demPromise;
    await Promise.all(
      [...layer.tiles.values()].map(
        (tile) =>
          new Promise<void>((resolve) => {
            // Nothing renders until the film opens, so the opening frame promotes its own tiles.
            const poll = () => {
              this.promote();
              if (tile.state === "ready" || tile.state === "missing") resolve();
              else setTimeout(poll, 40);
            };
            poll();
          }),
      ),
    );
  }

  private fractionAt(zoom: number): { x: number; y: number } {
    let f = this.fraction.get(zoom);
    if (!f) {
      f = mercatorFraction(this.lat, this.lon, zoom);
      this.fraction.set(zoom, f);
    }
    return f;
  }

  private async loadDem(): Promise<void> {
    const f = this.fractionAt(TERRAIN_ZOOM);
    const cx = Math.floor(f.x);
    const cy = Math.floor(f.y);
    const size = 256 * 3;
    const data = new Float32Array(size * size);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    let loaded = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        try {
          const image = await bitmap(`/media/ground/terrain/${TERRAIN_ZOOM}/${cx + dx}/${cy + dy}.webp`);
          if (this.disposed) { image?.close(); return; }
          if (!image) continue;
          context.drawImage(image, 0, 0);
          image.close();
          const pixels = context.getImageData(0, 0, 256, 256).data;
          for (let y = 0; y < 256; y += 1) {
            for (let x = 0; x < 256; x += 1) {
              const o = (y * 256 + x) * 4;
              data[(dy + 1) * 256 * size + y * size + (dx + 1) * 256 + x] =
                pixels[o] * 256 + pixels[o + 1] + pixels[o + 2] / 256 - 32_768;
            }
          }
          loaded += 1;
        } catch (error) {
          console.warn("[ground] terrain tile unavailable", error);
        }
      }
    }
    if (!loaded) return;
    const originX = cx - 1;
    const originY = cy - 1;
    const anchorPx = (f.x - originX) * 256;
    const anchorPy = (f.y - originY) * 256;
    const datum = data[Math.round(anchorPy) * size + Math.round(anchorPx)];
    this.dem = { data, size, originX, originY, datum };
    for (const layer of this.layers.values()) this.displace(layer);
  }

  /** Elevation in metres above the anchor at a ground offset in km. */
  private elevationAt(xKm: number, yKm: number): number {
    if (!this.dem) return 0;
    const widthKm = tileWidthMetres(this.lat, TERRAIN_ZOOM) / 1_000;
    const f = this.fractionAt(TERRAIN_ZOOM);
    const px = (f.x - this.dem.originX + xKm / widthKm) * 256;
    const py = (f.y - this.dem.originY - yKm / widthKm) * 256;
    const x0 = Math.max(0, Math.min(this.dem.size - 2, Math.floor(px)));
    const y0 = Math.max(0, Math.min(this.dem.size - 2, Math.floor(py)));
    const tx = Math.min(1, Math.max(0, px - x0));
    const ty = Math.min(1, Math.max(0, py - y0));
    const d = this.dem.data;
    const s = this.dem.size;
    const top = d[y0 * s + x0] * (1 - tx) + d[y0 * s + x0 + 1] * tx;
    const bottom = d[(y0 + 1) * s + x0] * (1 - tx) + d[(y0 + 1) * s + x0 + 1] * tx;
    return top * (1 - ty) + bottom * ty - this.dem.datum;
  }

  private displace(layer: Layer): void {
    if (!this.dem || layer.displaced) return;
    if (layer.zoom < TERRAIN_ZOOM || layer.zoom > TERRAIN_MAX_ZOOM) return;
    layer.displaced = true;
    for (const tile of layer.tiles.values()) {
      const positions = tile.mesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let index = 0; index < positions.count; index += 1) {
        const x = tile.centreX + positions.getX(index);
        const y = tile.centreY + positions.getY(index);
        positions.setZ(index, (this.elevationAt(x, y) * TERRAIN_EXAGGERATION) / 1_000);
      }
      positions.needsUpdate = true;
      tile.mesh.geometry.computeVertexNormals();
    }
  }

  private layer(zoom: number): Layer {
    let layer = this.layers.get(zoom);
    if (layer) return layer;
    const group = new THREE.Group();
    group.name = `ground-z${zoom}`;
    group.renderOrder = zoom;
    group.visible = false;
    this.scene.add(group);
    layer = { zoom, group, widthKm: tileWidthMetres(this.lat, zoom) / 1_000, tiles: new Map(), opacity: 0, wanted: false, displaced: false };
    this.layers.set(zoom, layer);
    return layer;
  }

  /** Make sure every tile inside the view (plus a margin) exists and is
   *  loading. Tiles are created lazily so the phone never pays for the
   *  desktop's width. */
  private request(layer: Layer, altitudeKm: number, offsetX: number, offsetY: number): void {
    const f = this.fractionAt(layer.zoom);
    const w = layer.widthKm;
    const halfW = altitudeKm * Math.tan((FOV_DEG * Math.PI) / 360) * this.aspect + w * 0.35;
    const halfH = altitudeKm * Math.tan((FOV_DEG * Math.PI) / 360) + w * 0.35;
    const x0 = Math.max(Math.floor(f.x - STORE_HALF_X), Math.floor(f.x + (offsetX - halfW) / w));
    const x1 = Math.min(Math.floor(f.x + STORE_HALF_X), Math.floor(f.x + (offsetX + halfW) / w));
    const y0 = Math.max(Math.floor(f.y - STORE_HALF_Y), Math.floor(f.y - (offsetY + halfH) / w));
    const y1 = Math.min(Math.floor(f.y + STORE_HALF_Y), Math.floor(f.y - (offsetY - halfH) / w));
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const key = `${x}/${y}`;
        if (layer.tiles.has(key)) continue;
        this.createTile(layer, x, y, key);
      }
    }
    if (this.dem && !layer.displaced) this.displace(layer);
  }

  private createTile(layer: Layer, x: number, y: number, key: string): void {
    const f = this.fractionAt(layer.zoom);
    const w = layer.widthKm;
    const geometry = new THREE.PlaneGeometry(w, w, TILE_SEGMENTS, TILE_SEGMENTS);
    const grade = gradeFor(layer.zoom);
    const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(grade[0], grade[1], grade[2]), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
    const centreX = (x + 0.5 - f.x) * w;
    const centreY = -(y + 0.5 - f.y) * w;
    mesh.position.set(centreX, centreY, 0);
    mesh.renderOrder = layer.zoom;
    layer.group.add(mesh);
    const tile: Tile = { mesh, centreX, centreY, state: "loading", reveal: 0 };
    layer.tiles.set(key, tile);
    if (layer.displaced) {
      layer.displaced = false;
      this.displace(layer);
    }
    const source = sourceFor(layer.zoom);
    bitmap(`/media/ground/${source.id}/${layer.zoom}/${x}/${y}.webp`)
      .then((image) => {
        if (!image) {
          tile.state = "missing";
          return;
        }
        if (this.layers.get(layer.zoom) !== layer || layer.tiles.get(key) !== tile) {
          image.close();
          tile.state = "missing";
          return;
        }
        const texture = new THREE.CanvasTexture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        // A whole layer's tiles arrive together; uploading forty textures in
        // one frame is a hitch, so `render` promotes a few per frame.
        this.uploadQueue.push({ tile, texture, material, layer, key });
      })
      .catch((error: unknown) => {
        tile.state = "missing";
        console.warn(`[ground z${layer.zoom}] tile unavailable`, error);
      });
  }

  /** Move a few decoded tiles onto the GPU. */
  private promote(): void {
    for (let n = 0; n < UPLOADS_PER_FRAME && this.uploadQueue.length; n += 1) {
      const { tile, texture, material, layer, key } = this.uploadQueue.shift()!;
      if (this.layers.get(layer.zoom) !== layer || layer.tiles.get(key) !== tile) {
        releaseTexture(texture);
        tile.state = "missing";
        continue;
      }
      material.map = texture;
      material.needsUpdate = true;
      this.renderer.initTexture(texture);
      tile.state = "ready";
    }
  }

  /** Tiles still on their way for the active layer: a gate can wait on zero. */
  pending(): number {
    const layer = this.layers.get(this.activeZoom);
    if (!layer) return 0;
    let count = 0;
    for (const tile of layer.tiles.values()) if (tile.state === "loading") count += 1;
    return count;
  }

  activeLayerZoom(): number {
    return this.activeZoom;
  }

  /** How much of the ground is actually drawable right now: the best live
   *  visible layer's coverage of the camera view. Zero after a sleep until tiles land again,
   *  so a descent never fades the clear colour in over the planet. */
  readiness(): number {
    let best = 0;
    for (const layer of this.layers.values()) {
      if (layer.group.visible) best = Math.max(best, this.readyFraction(layer, true));
    }
    return best;
  }

  private readyFraction(layer: Layer, drawable = false): number {
    if (!Number.isFinite(this.lastAltitude)) return 0;
    const halfH = this.lastAltitude * Math.tan((FOV_DEG * Math.PI) / 360);
    const halfW = halfH * this.aspect;
    const halfTile = layer.widthKm / 2;
    let covered = 0;
    for (const tile of layer.tiles.values()) {
      if (tile.state !== "ready" || (drawable && tile.reveal <= 0)) continue;
      const width = Math.max(0, Math.min(tile.centreX + halfTile, this.lastOffsetX + halfW)
        - Math.max(tile.centreX - halfTile, this.lastOffsetX - halfW));
      const height = Math.max(0, Math.min(tile.centreY + halfTile, this.lastOffsetY + halfH)
        - Math.max(tile.centreY - halfTile, this.lastOffsetY - halfH));
      // Materials already apply the tile and layer fades. Readiness measures
      // available imagery so the canvas does not apply that alpha a second time.
      covered += width * height;
    }
    return Math.min(1, covered / (4 * halfW * halfH));
  }

  render(altitudeKm: number, offsetXKm: number, offsetYKm: number, deltaSeconds: number): void {
    if (this.asleep) return;
    this.promote();
    const zoom = this.zoomFor(altitudeKm);
    const active = this.layer(zoom);
    this.request(active, altitudeKm, offsetXKm, offsetYKm);
    // Warm the neighbours so a zoom change never waits on the network.
    if (zoom > MIN_ZOOM) this.request(this.layer(zoom - 1), altitudeKm, offsetXKm, offsetYKm);
    if (zoom < MAX_ZOOM && altitudeKm < this.lastAltitude) this.request(this.layer(zoom + 1), altitudeKm, offsetXKm, offsetYKm);
    this.lastAltitude = altitudeKm;
    this.lastOffsetX = offsetXKm;
    this.lastOffsetY = offsetYKm;
    this.activeZoom = zoom;

    // A descent from orbit crosses fifteen zooms in a few seconds, faster than
    // their tiles can land. Coarser layers therefore hold their opacity, and
    // nothing is released, until the active layer is mostly drawable.
    const activeReady = this.readyFraction(active);
    for (const layer of [...this.layers.values()]) {
      if (Math.abs(layer.zoom - zoom) > KEEP_ZOOM_RANGE && (activeReady >= 0.9 || layer.zoom > zoom)) {
        this.disposeLayer(layer);
        continue;
      }
      // The active layer shows; a finer layer above it lingers while it fades so
      // the coarser imagery under it is never seen arriving.
      const holding = layer.zoom < zoom && activeReady < 0.9;
      const target = layer.zoom === zoom ? 1 : holding ? layer.opacity : 0;
      layer.opacity += Math.sign(target - layer.opacity) * Math.min(Math.abs(target - layer.opacity), LAYER_FADE_PER_SECOND * deltaSeconds);
      layer.group.visible = layer.opacity > 0.001;
      for (const tile of layer.tiles.values()) {
        if (tile.state === "ready" && tile.reveal < 1) tile.reveal = Math.min(1, tile.reveal + TILE_FADE_PER_SECOND * deltaSeconds);
        tile.mesh.material.opacity = layer.opacity * tile.reveal;
      }
    }

    this.camera.position.set(offsetXKm, offsetYKm, Math.max(0.012, altitudeKm));
    const near = Math.min(2, Math.max(0.005, altitudeKm * 0.2));
    if (Math.abs(this.camera.near - near) / this.camera.near > 0.2) {
      this.camera.near = near;
      this.camera.far = Math.max(3_000, altitudeKm * 8);
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(offsetXKm, offsetYKm, 0);
    this.renderer.render(this.scene, this.camera);
  }

  /** A layer leaves the scene now and gives its GPU memory back over the next
   *  frames (`tidy`): disposing forty textures in one frame is a visible hitch,
   *  and the reference's forceContextLoss at the film's end was a 165 ms one. */
  private disposeLayer(layer: Layer): void {
    this.scene.remove(layer.group);
    if (this.layers.get(layer.zoom) === layer) this.layers.delete(layer.zoom);
    for (let index = this.uploadQueue.length - 1; index >= 0; index -= 1) {
      const upload = this.uploadQueue[index];
      if (upload.layer !== layer) continue;
      releaseTexture(upload.texture);
      this.uploadQueue.splice(index, 1);
    }
    for (const tile of layer.tiles.values()) if (tile.state === "loading") tile.state = "missing";
    this.disposeQueue.push(layer);
  }

  /** Release a few tiles per frame. The world calls this every tick. */
  tidy(): void {
    let budget = DISPOSE_TILES_PER_FRAME;
    while (budget > 0 && this.disposeQueue.length) {
      const layer = this.disposeQueue[0];
      for (const [key, tile] of layer.tiles) {
        tile.mesh.geometry.dispose();
        if (tile.mesh.material.map) releaseTexture(tile.mesh.material.map);
        tile.mesh.material.dispose();
        layer.tiles.delete(key);
        budget -= 1;
        if (budget === 0) break;
      }
      if (layer.tiles.size === 0) this.disposeQueue.shift();
    }
  }

  /** The ground has faded out for good: stop drawing, let the tiles go. */
  sleep(): void {
    if (this.asleep) return;
    this.asleep = true;
    for (const layer of [...this.layers.values()]) this.disposeLayer(layer);
    this.activeZoom = -1;
  }

  /** Terminal fallback has no future frames in which to drain `tidy`. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.sleep();
    while (this.disposeQueue.length) this.tidy();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /** A flight is coming back down: layers rebuild from the (cached) tiles on demand. */
  wake(): void {
    if (this.disposed) return;
    this.asleep = false;
  }

  isAsleep(): boolean {
    return this.asleep;
  }
}
