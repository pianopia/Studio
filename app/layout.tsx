import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio",
  description: "Image and video generation studio"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
