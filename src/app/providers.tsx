"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import { QueryProvider } from "@/components/QueryProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastViewport } from "@/components/ToastViewport";
import { OnboardingGate } from "@/components/OnboardingGate";
import { theme } from "@/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <QueryProvider>
          <SessionProvider>
            <AuthProvider>
              <ToastViewport />
              <OnboardingGate>
                {children}
              </OnboardingGate>
            </AuthProvider>
          </SessionProvider>
        </QueryProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

