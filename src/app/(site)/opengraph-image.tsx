import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = SITE_TAGLINE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#0b0b10 40%,#3a0d1d)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>▶</div>
          <div style={{ fontSize: 64, fontWeight: 800 }}>{SITE_NAME}</div>
        </div>
        <div style={{ marginTop: 32, fontSize: 40, color: "#c9c9d4", maxWidth: 900 }}>{SITE_TAGLINE}</div>
      </div>
    ),
    size,
  );
}
