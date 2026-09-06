"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping, BoxGeometry, CanvasTexture, Color, Group, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PerspectiveCamera,
  PlaneGeometry, PointLight, Raycaster, Scene, SpotLight, SRGBColorSpace, Texture,
  Vector2, WebGLRenderer,
} from "three";
import { loadAuthoredRoom } from "@/lib/room/authoredRoomAsset";
import { RoomResources } from "@/lib/room/RoomResources";
import type { RoomView } from "./roomMovement";
import styles from "./BlenderAboutRoom.module.css";

function addMonitor(resources: RoomResources) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 788;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#15292e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#b1cac5";
    context.font = "24px sans-serif";
    context.fillText("A LITTLE ABOUT ME", 100, 150);
    context.fillStyle = "#f4f0e6";
    context.font = "76px Georgia, serif";
    context.fillText("Mohamad Awad", 96, 292);
    context.fillStyle = "#cbd7d3";
    context.font = "30px sans-serif";
    context.fillText("Civil engineering. Practical software.", 100, 377);
    context.strokeStyle = "#5b7778";
    context.beginPath(); context.moveTo(100, 460); context.lineTo(1300, 460); context.stroke();
    context.fillStyle = "#dfb481";
    context.font = "28px sans-serif";
    context.fillText("Open my profile  →", 100, 580);
    context.fillStyle = "#8da6a4";
    context.font = "22px sans-serif";
    context.fillText("TORONTO, CANADA", 100, 690);
  }
  const map = resources.own(new CanvasTexture(canvas));
  map.colorSpace = SRGBColorSpace;
  const screen = new Mesh(resources.own(new PlaneGeometry(1.12, 0.63)), resources.own(new MeshBasicMaterial({ map, toneMapped: false })));
  screen.position.set(0, 1.765, -1.971);
  screen.name = "about-profile-monitor";
  return screen;
}

function addDeskPrint(resources: RoomResources) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 650;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#e7dfcd";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#355351";
    context.font = "22px sans-serif";
    context.fillText("TORONTO METROPOLITAN UNIVERSITY", 75, 100);
    context.font = "64px Georgia, serif";
    context.fillText("Civil engineering.", 70, 265);
    context.fillText("Practical software.", 70, 355);
    context.fillStyle = "#837059";
    context.fillRect(75, 465, 150, 3);
    context.font = "24px sans-serif";
    context.fillText("MOHAMAD AWAD", 75, 555);
  }
  const map = resources.own(new CanvasTexture(canvas));
  map.colorSpace = SRGBColorSpace;
  const print = new Mesh(resources.own(new PlaneGeometry(0.985, 0.534)), resources.own(new MeshStandardMaterial({ map, roughness: 0.95 })));
  print.position.set(0, 2.44, -2.451);
  return print;
}

async function addPortrait(group: Group, resources: RoomResources, signal: AbortSignal) {
  const response = await fetch("/images/headshot.jpg", { signal });
  if (!response.ok) throw new Error("Portrait unavailable");
  const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: "flipY" });
  const map = resources.own(new Texture(bitmap));
  if (signal.aborted) return;
  map.colorSpace = SRGBColorSpace;
  map.needsUpdate = true;
  // The original photograph remains intact, fitted inside a pale mat.
  const frame = new Group();
  frame.position.set(-1.18, 2.18, -2.42);
  const surround = new Mesh(resources.own(new BoxGeometry(0.65, 0.76, 0.045)), resources.own(new MeshStandardMaterial({ color: "#392e25", roughness: 0.68 })));
  const mat = new Mesh(resources.own(new PlaneGeometry(0.59, 0.7)), resources.own(new MeshStandardMaterial({ color: "#e6dfce", roughness: 0.92 })));
  mat.position.z = 0.024;
  const ratio = bitmap.width / bitmap.height;
  const width = Math.min(0.49, 0.58 * ratio);
  const photograph = new Mesh(resources.own(new PlaneGeometry(width, width / ratio)), resources.own(new MeshBasicMaterial({ map, toneMapped: false })));
  photograph.position.z = 0.026;
  frame.name = "original-mohamad-photograph";
  frame.add(surround, mat, photograph);
  group.add(frame);
}

/** An on-demand view of the authored Blender room, independent of the journey. */
export function BlenderAboutRoom({ onComputerClick, view = { x: 0, y: 0 } }: { onComputerClick?: () => void; view?: RoomView }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onComputerClick);
  const viewRef = useRef(view);
  const renderView = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => { callbackRef.current = onComputerClick; }, [onComputerClick]);
  useEffect(() => { viewRef.current = view; renderView.current?.(); }, [view]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = new AbortController();
    const resources = new RoomResources();
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      setStatus("error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "A Blender-authored study with a wood desk, computer, and framed photograph of Mohamad");
    host.appendChild(renderer.domElement);
    const scene = new Scene();
    scene.background = new Color("#d3ccbc");
    const room = new Group();
    scene.add(room);
    const camera = new PerspectiveCamera(49, 1, 0.05, 30);
    camera.position.set(1.1, 2.13, 1.85);
    camera.lookAt(-0.32, 1.64, -1.72);
    const ambient = new HemisphereLight("#d5e6ef", "#826b4e", 0.09);
    const windowLight = new SpotLight("#dfebf5", 25, 14, 1.05, 0.85, 2);
    windowLight.position.set(-3, 2.2, 0);
    windowLight.target.position.set(0.6, 1, -0.4);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.set(2048, 2048);
    windowLight.shadow.camera.near = 0.1;
    windowLight.shadow.camera.far = 14;
    windowLight.shadow.normalBias = 0.008;
    windowLight.shadow.bias = -0.00005;
    windowLight.shadow.radius = 4;
    const lamp = new PointLight("#ffd7a0", 2.1, 4.5, 2);
    lamp.position.set(-0.69, 1.639, -2.07);
    scene.add(ambient, windowLight, windowLight.target, lamp);
    let ready = false;
    let visible = true;
    let screen: Mesh | undefined;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const draw = () => {
      if (!controller.signal.aborted && ready && visible && !document.hidden) renderer.render(scene, camera);
    };
    const updateView = () => {
      camera.position.set(1.1 - viewRef.current.x * 0.38, 2.13 + viewRef.current.y * 0.18, 1.85);
      camera.lookAt(-0.32, 1.64, -1.72);
      draw();
    };
    renderView.current = updateView;
    updateView();
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height || controller.signal.aborted) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 0.8 ? 57 : 49;
      camera.updateProjectionMatrix();
      draw();
    };
    const isMonitor = (event: MouseEvent) => {
      if (!screen || !ready) return false;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(screen).length > 0;
    };
    const pointerMove = (event: PointerEvent) => { renderer.domElement.style.cursor = callbackRef.current && isMonitor(event) ? "pointer" : "grab"; };
    const click = (event: MouseEvent) => { if (event.button === 0 && isMonitor(event)) callbackRef.current?.(); };
    const contextLost = (event: Event) => { event.preventDefault(); if (!controller.signal.aborted) setStatus("error"); };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; draw(); });
    intersection.observe(host);
    document.addEventListener("visibilitychange", draw);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("click", click);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    resize();
    const quality = window.matchMedia("(max-width: 767px)").matches ? "low" : "high";
    void loadAuthoredRoom(quality, resources, controller.signal).then(async ({ gltf }) => {
      if (controller.signal.aborted) return;
      room.add(gltf.scene);
      screen = addMonitor(resources);
      room.add(screen, addDeskPrint(resources));
      try { await addPortrait(room, resources, controller.signal); } catch { /* The room remains available if the portrait cannot load. */ }
      if (controller.signal.aborted) return;
      ready = true;
      resize();
      setStatus("ready");
    }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });

    return () => {
      controller.abort();
      renderView.current = null;
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", draw);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("click", click);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      resources.dispose();
      windowLight.shadow.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div className={styles.room} data-testid="blender-about-room" data-status={status}>
    <div ref={hostRef} className={styles.canvas} />
    {status !== "ready" && <p className={styles.status} role="status">{status === "loading" ? "Opening the study…" : "The 3D room couldn’t open on this device. You can still explore the photographic room."}</p>}
    {status === "ready" && onComputerClick && <button className={styles.profile} type="button" onClick={onComputerClick}>Open my profile <span aria-hidden="true">↗</span></button>}
  </div>;
}

export default BlenderAboutRoom;
