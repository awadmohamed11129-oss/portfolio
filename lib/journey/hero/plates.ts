// Ground variants B and C: generated plates over the opening of the film.
//   ?ground=b  the first ~2 s open on a wet-asphalt plate that dissolves into the tiles
//   ?ground=c  road / city / Earth plates carry the whole film, no streaming
// Plates live in /media/plates/. If a plate is missing the variant falls back
// to A and says so on <html data-ground-fallback="a">, so a recording can never
// pass off the base build as a variant.
import { START_ALTITUDE_KM } from "./math";

export type GroundVariant = "a" | "b" | "c";

const PLATES: Record<Exclude<GroundVariant, "a">, string[]> = {
  b: ["/media/plates/b-opening-asphalt.webp"],
  c: ["/media/plates/c-road.webp", "/media/plates/c-city.webp", "/media/plates/c-earth.webp"],
};

export type Plates = {
  variant: GroundVariant;
  /** Drive the plates from the current altitude and film progress. */
  update(altitudeKm: number, endAltitudeKm: number): void;
};

async function available(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok && (response.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

export async function createPlates(requested: string | null, host: HTMLElement): Promise<Plates> {
  const variant: GroundVariant = requested === "b" || requested === "c" ? requested : "a";
  if (variant === "a") return { variant, update: () => undefined };
  const urls = PLATES[variant];
  const present = await Promise.all(urls.map(available));
  if (present.some((ok) => !ok)) {
    document.documentElement.dataset.groundFallback = "a";
    document.documentElement.dataset.groundRequested = variant;
    return { variant: "a", update: () => undefined };
  }
  document.documentElement.dataset.groundVariant = variant;
  const images = urls.map((url) => {
    const image = document.createElement("img");
    image.className = "plate";
    image.src = url;
    image.alt = "";
    image.decoding = "async";
    host.append(image);
    return image;
  });

  const logSpan = (from: number, to: number, altitude: number) =>
    (Math.log(altitude) - Math.log(from)) / (Math.log(to) - Math.log(from));

  if (variant === "b") {
    return {
      variant,
      update(altitudeKm) {
        // Dissolve over the first ~2 s of the ramp (15 m → 60 m), zooming the plate out with the camera.
        const t = Math.min(1, Math.max(0, logSpan(START_ALTITUDE_KM, 0.06, altitudeKm)));
        images[0].style.opacity = String(1 - t * t);
        images[0].style.transform = `scale(${1 + t * 0.9})`;
      },
    };
  }
  return {
    variant,
    update(altitudeKm, endAltitudeKm) {
      // Three bands, each plate zooming out through its band and dissolving into the next.
      const bands: Array<[number, number]> = [
        [START_ALTITUDE_KM, 2],
        [2, 600],
        [600, endAltitudeKm],
      ];
      bands.forEach(([from, to], index) => {
        const t = logSpan(from, to, altitudeKm);
        const inBand = t >= -0.15 && t <= 1.15;
        const fadeIn = index === 0 ? 1 : Math.min(1, Math.max(0, (t + 0.15) / 0.3));
        const fadeOut = index === bands.length - 1 ? 1 : Math.min(1, Math.max(0, (1.15 - t) / 0.3));
        images[index].style.opacity = inBand ? String(fadeIn * fadeOut) : "0";
        images[index].style.transform = `scale(${1 + Math.min(1.2, Math.max(-0.15, t)) * 1.4})`;
      });
    },
  };
}
