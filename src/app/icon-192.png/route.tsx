import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e11d48" }}>
        <svg width="192" height="192" viewBox="0 0 64 64"><path d="M25 18v28l22-14z" fill="#fff" /></svg>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
