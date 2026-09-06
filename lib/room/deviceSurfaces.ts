import { CanvasTexture, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import type { RoomTarget } from "@/lib/portfolio/contracts";
import { pavescan } from "@/content/facts";
import { RoomResources } from "./RoomResources";

function surface(resources: RoomResources, kind: "monitor" | "phone" | "board") {
  const material = resources.own(new MeshBasicMaterial({ color: "#e8f0f2", toneMapped: false }));
  if (typeof document === "undefined") return material;
  const canvas = document.createElement("canvas");
  canvas.width = kind === "phone" ? 384 : 1536;
  canvas.height = kind === "phone" ? 768 : kind === "board" ? 832 : 864;
  const context = canvas.getContext("2d");
  if (!context) return material;
  context.fillStyle = kind === "board" ? "#e9e6d9" : "#e8f0f2";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#17384b";
  if (kind === "monitor") {
    context.font = "500 84px sans-serif"; context.fillText("Projects", 90, 156);
    context.font = "45px sans-serif";
    ["PaveScan AI", "Civic Data Pipeline", "Pop-Up Chapel", "LocalFlow"].forEach((label, index) => context.fillText(label, 90, 300 + index * 130));
  } else if (kind === "phone") {
    context.font = "500 42px sans-serif"; context.fillText("Mohamad", 30, 90); context.fillText("Awad", 30, 142);
    context.font = "25px sans-serif";
    ["Civil engineering", "Toronto", "Profile & contact", "Email", "Resume"].forEach((label, index) => context.fillText(label, 30, 220 + index * 85));
  } else {
    context.font = "600 128px sans-serif"; context.fillText("PaveScan AI", 82, 180);
    context.font = "52px sans-serif"; context.fillText("Bundled Toronto survey", 86, 270);
    context.font = "500 110px sans-serif"; context.fillText(pavescan.routeKm.value, 86, 480); context.fillText(pavescan.pci.value, 850, 480);
    context.font = "54px sans-serif"; context.fillText("Scored road", 90, 565); context.fillText("Estimated PCI", 854, 565);
    context.font = "48px sans-serif"; context.fillText(`${pavescan.stretches.value} separate stretches`, 90, 720);
  }
  material.map = resources.own(new CanvasTexture(canvas));
  material.map.colorSpace = SRGBColorSpace;
  material.color.set("#ffffff");
  return material;
}

export function addDeviceSurfaces(group: Group, resources: RoomResources): RoomTarget[] {
  const screen = (id: "monitor" | "phone", width: number, height: number, position: [number, number, number], distance: number, fov: number): RoomTarget => {
    const object = new Mesh(resources.own(new PlaneGeometry(width, height)), surface(resources, id));
    object.name = `${id}-screen`; object.position.set(...position); object.userData.device = id;
    group.add(object);
    return { id, object, width, height, anchor: { position: [position[0], position[1], position[2] + distance], target: position, fov } };
  };
  const targets = [screen("monitor", 1.12, 0.63, [0, 1.765, -1.971], 1.13, 42), screen("phone", 0.077, 0.157, [0.77, 1.363, -1.675], 0.30, 38)];
  const board = new Mesh(resources.own(new PlaneGeometry(0.985, 0.534)), surface(resources, "board"));
  board.name = "pavescan-survey-work-sheet"; board.position.set(0, 2.44, -2.451); group.add(board);
  return targets;
}
