import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#243d32" }}>
      <div style={{ position: "absolute", left: 14, top: 5, width: 4, height: 22, background: "#dfc487" }} />
      <div style={{ position: "absolute", left: 5, top: 14, width: 22, height: 4, background: "#dfc487" }} />
      {[[12, 5], [12, 23], [5, 12], [23, 12]].map(([left, top]) =>
        <div key={`${left}:${top}`} style={{ position: "absolute", left, top, width: left === 12 ? 8 : 4, height: left === 12 ? 4 : 8, background: "#dfc487" }} />
      )}
    </div>,
    size,
  );
}
