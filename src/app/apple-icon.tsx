import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e11d48" }}>
        <svg width="180" height="180" viewBox="0 0 64 64"><path d="M25 18v28l22-14z" fill="#fff" /></svg>
      </div>
    ),
    size,
  );
}
