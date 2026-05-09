import { ImageResponse } from "next/og";

export const alt =
  "Mohamad Awad — Civil engineering at Toronto Metropolitan University. AI and automation tools for infrastructure inspection.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [inter, fraunces] = await Promise.all([
    loadFont(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
    ),
    loadFont(
      "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIchRujDg.ttf"
    ),
  ]);

  const fonts: NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"] = [];
  if (inter) {
    fonts.push({ name: "Inter", data: inter, weight: 400, style: "normal" });
  }
  if (fraunces) {
    fonts.push({
      name: "Fraunces",
      data: fraunces,
      weight: 500,
      style: "normal",
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "linear-gradient(135deg, #0A0A0A 0%, #18181B 100%)",
          color: "#FAFAFA",
          fontFamily: inter ? "Inter" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#A1A1AA",
            }}
          >
            Toronto, ON · 2nd-year civil engineering · TMU
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 132,
              lineHeight: 1.05,
              fontFamily: fraunces ? "Fraunces" : "serif",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            Mohamad Awad
          </div>
          <div
            style={{
              marginTop: 28,
              height: 6,
              width: 120,
              background: "#3F3F46",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              marginTop: 36,
              fontSize: 36,
              lineHeight: 1.35,
              color: "#E4E4E7",
              maxWidth: 880,
            }}
          >
            Civil engineering at Toronto Metropolitan University. AI and
            automation tools for infrastructure inspection.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 22,
            color: "#71717A",
            letterSpacing: "0.05em",
          }}
        >
          mohamadawad.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
