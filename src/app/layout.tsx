import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@mantine/core/styles.css";
import React from "react";
import { ColorSchemeScript } from "@mantine/core";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Grid — Build Skills. Ship Projects. Own Your Campus.",
  description:
    "Grid is the peer-driven platform where university students trade expertise, form project teams, and build together. Join 1,200+ students across 15+ colleges.",
  keywords: ["student collaboration", "skill swap", "peer learning", "campus projects", "university platform"],
  openGraph: {
    title: "Grid — Build Skills. Ship Projects.",
    description: "The campus collaboration platform built for student builders.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
