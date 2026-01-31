"use client";

import React from "react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import { QueryProvider } from "@/components/QueryProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastViewport } from "@/components/ToastViewport";
import { theme } from "@/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
