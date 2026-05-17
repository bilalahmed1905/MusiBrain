import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MusiBrain — Your Music Taste, Understood",
  description:
    "MusiBrain builds a persistent taste brain that explains why you love certain songs, then generates emotionally aligned playlists for every moment of your life.",
  keywords: ["music", "playlist", "AI", "taste profile", "music recommendation"],
  openGraph: {
    title: "MusiBrain — Your Music Taste, Understood",
    description: "AI-powered playlists that actually feel like you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
