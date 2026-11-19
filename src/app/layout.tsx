import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const geist = Geist({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-geist",
});

const noto = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  preload: false,
});

export const metadata: Metadata = {
  title: "あと何回休める？",
  description:
    "授業ごとの欠席を1タップで数えて、単位を落とさずにあと何回休めるかを大きな数字で出します。ログイン無し・データは端末だけ。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geist.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
