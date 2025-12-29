import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { QueryProvider } from '@/components/QueryProvider';
import { theme } from '../theme';
import { ToastViewport } from '@/components/ToastViewport';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'College Platform',
  description: 'Campus-wide skill and resource sharing platform',
};

import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <ModalsProvider>
            <QueryProvider>
              <AuthProvider>
                <ToastViewport />
                {children}
              </AuthProvider>
            </QueryProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
