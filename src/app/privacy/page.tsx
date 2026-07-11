"use client";

import React from "react";
import { Container, Title, Text, Stack } from "@mantine/core";
import { Navbar } from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Title order={1}>Privacy Policy</Title>
          <Text>
            At Grid, we take your privacy seriously. This Privacy
            Policy explains how we collect, use, and protect your personal
            information.
          </Text>

          <Title order={3}>1. Information We Collect</Title>
          <Text>
            We collect information you provide directly to us, such as when you
            create an account, update your profile, or post content. This may
            include your name, email address, university details, and any other
            information you choose to provide.
          </Text>

          <Title order={3}>2. How We Use Your Information</Title>
          <Text>
            We use your information to provide, maintain, and improve our
            services, to communicate with you, and to personalize your
            experience on Grid.
          </Text>

          <Title order={3}>3. Sharing of Information</Title>
          <Text>
            We do not share your personal information with third parties except
            as described in this policy or with your consent. Your profile
            information may be visible to other users of the platform.
          </Text>

          <Title order={3}>4. Data Security</Title>
          <Text>
            We implement reasonable security measures to protect your
            information. However, no method of transmission over the internet is
            completely secure.
          </Text>

          <Text size="sm" c="dimmed" mt="xl">
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </Stack>
      </Container>
    </>
  );
}
