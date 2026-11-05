import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexLoot — Chợ cộng đồng mua bán & đấu giá",
    short_name: "NexLoot",
    description:
      "NexLoot là chợ cộng đồng: mua bán, đấu giá, sàn đấu kiến thức và kết nối cộng đồng sáng tạo.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff4500",
    lang: "vi",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
