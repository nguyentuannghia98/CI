import "./globals.css"; 
import type { Metadata, Viewport } from "next";
import ClientRootWrapper from "./ClientRootWrapper";
import { ThemeProvider } from "../components/ThemeProvider"; 
// Đã xóa import ThemeToggle ở đây
import Providers from "../components/providers/Providers"; 
import { ChatProvider } from "@/components/MiniChat/ChatContext"; 
import { AuthProvider } from "@/components/auth/providers/AuthProvider";
// 1. IMPORT AuthOverlay ở đây
import AuthOverlay from "@/components/auth/components/AuthOverlay"; 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "NexLoot";
const SITE_DESCRIPTION =
  "NexLoot là chợ cộng đồng: mua bán, đấu giá, sàn đấu kiến thức và kết nối cộng đồng sáng tạo. Đăng bán, khám phá cộng đồng và giao thương chỉ trong vài phút.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Chợ cộng đồng mua bán & đấu giá`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "NexLoot",
    "chợ cộng đồng",
    "mua bán",
    "đấu giá",
    "marketplace",
    "rao vặt",
    "cộng đồng",
    "giao thương",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Chợ cộng đồng mua bán & đấu giá`,
    description: SITE_DESCRIPTION,
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: `${SITE_NAME} — chợ cộng đồng` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Chợ cộng đồng mua bán & đấu giá`,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-main"> {/* Sử dụng bg-main từ globals.css */}
        <Providers>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProvider>
              <ChatProvider>
                <div id="app-root">
                  <main className="bg-main transition-colors duration-300">
                      <ClientRootWrapper>{children}</ClientRootWrapper>
                  </main>
                </div>

                {/* 2. ĐẶT AuthOverlay Ở ĐÂY */}
                {/* Nó sẽ luôn lắng nghe Store và hiện lên khi cần */}
                <AuthOverlay />

                {/* Đã xóa ThemeToggle ở đây để không hiện lơ lửng ngoài màn hình nữa */}
                
                <div id="modal-root"></div>
              </ChatProvider>
            </AuthProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}