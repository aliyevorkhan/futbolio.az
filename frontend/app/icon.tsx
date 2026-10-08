import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated favicon — a brand-green "f" monogram. Placeholder until the
 * design team supplies a real favicon asset; this keeps `/icon` from
 * 404ing in the meantime.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1410",
          borderRadius: 8,
          color: "#00E676",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        f
      </div>
    ),
    { ...size },
  );
}
