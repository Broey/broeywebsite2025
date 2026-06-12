import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";

export const runtime = "edge";
export const alt = "Broey. genre-fluid electronic artist and producer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b0d10 0%, #171b22 48%, #0b0d10 100%)",
          color: "#f0ece1",
          padding: "72px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#3fb1d9",
            fontSize: 30,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          <span>{siteConfig.handle}</span>
          <span>{siteConfig.location}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: "#d3a95b",
              fontSize: 34,
              fontWeight: 700,
              marginBottom: 22,
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              maxWidth: 920,
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: -1,
            }}
          >
            Genre-fluid electronic artist and producer.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
