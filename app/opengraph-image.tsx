import { ImageResponse } from "next/og";
import { SITE_NAME, defaultHero } from "@/lib/defaults";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// SNS共有用のOGP画像(実写真の提供後にデザイン画像へ差し替え可能)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #265842 0%, #384f5c 100%)",
          color: "#f8fafb",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#e9c46a",
            marginBottom: 24,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {defaultHero.catchcopy}
        </div>
        <div style={{ fontSize: 26, marginTop: 32, opacity: 0.9 }}>
          新潟県十日町市まつだい × 早稲田大学
        </div>
      </div>
    ),
    { ...size }
  );
}
