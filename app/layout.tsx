import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { SITE_NAME } from "@/lib/defaults";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | 新潟県十日町市まつだいで活動する早稲田大学の学生サークル`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "新潟県十日町市まつだいで、農業や除雪、地域交流に取り組む早稲田大学の学生サークルです。現地の方と共に四季折々のまつだいでワクワクな瞬間を!",
  openGraph: {
    title: SITE_NAME,
    description:
      "新潟県十日町市まつだいで、農業や除雪、地域交流に取り組む早稲田大学の学生サークルです。",
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
