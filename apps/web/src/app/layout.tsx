import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DreamPlay Pianos",
  description: "DreamPlay Pianos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
