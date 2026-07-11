"use client";

import React from "react";
import { Container, Title, Text, Stack, List } from "@mantine/core";
import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Title order={1}>Terms of Service</Title>
          <Text>
            Welcome to Grid. By accessing or using our platform, you
            agree to be bound by these Terms of Service.
          </Text>

          <Title order={3}>1. Acceptance of Terms</Title>
          <Text>
            By accessing or using Grid, you agree to comply with and
            be bound by these terms. If you do not agree to these terms, please
            do not use our platform.
          </Text>

          <Title order={3}>2. User Conduct</Title>
          <Text>
            You agree to use Grid only for lawful purposes and in a
            way that does not infringe the rights of, restrict or inhibit anyone
            else's use and enjoyment of the platform. Prohibited behavior
            includes harassing or causing distress or inconvenience to any
            person, transmitting obscene or offensive content, or disrupting the
            normal flow of dialogue within our platform.
          </Text>

          <Title order={3}>3. Content</Title>
          <Text>
            You retain ownership of the content you post on Grid.
            However, by posting content, you grant us a non-exclusive,
            worldwide, royalty-free license to use, copy, reproduce, process,
            adapt, modify, publish, transmit, display, and distribute such
            content.
          </Text>

          <Title order={3}>4. Termination</Title>
          <Text>
            We reserve the right to terminate or suspend your access to
            Grid immediately, without prior notice or liability, for
            any reason whatsoever, including without limitation if you breach
            the Terms.
          </Text>

          <Text size="sm" c="dimmed" mt="xl">
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </Stack>
      </Container>
    </>
  );
}
