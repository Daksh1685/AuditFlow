import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#2d3142",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M38 90 L64 38 L90 90"
            stroke="#FFFFFF"
            stroke-width="14"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M50 74 L68 56 L82 66 L112 36"
            stroke="#e8b84b"
            stroke-width="9"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
