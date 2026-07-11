"use client";

import React from "react";
import { Container, Title, Text, Stack, List, ThemeIcon } from "@mantine/core";
import { Navbar } from "@/components/Navbar";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function GuidelinesPage() {
  return (
    <>
      <Navbar />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Title order={1}>Community Guidelines</Title>
          <Text size="lg">
            To keep Grid a safe and helpful place for everyone, we ask
            that you follow these guidelines.
          </Text>

          <Title order={3}>Do&apos;s</Title>
          <List
            spacing="sm"
            size="md"
            icon={
              <ThemeIcon color="teal" size={24} radius="xl">
                <IconCheck size={16} />
              </ThemeIcon>
            }
          >
            <List.Item>Be respectful and kind to other members.</List.Item>
            <List.Item>Share helpful and relevant resources.</List.Item>
            <List.Item>Give credit where credit is due.</List.Item>
            <List.Item>Report inappropriate content or behavior.</List.Item>
            <List.Item>Keep discussions constructive and on-topic.</List.Item>
          </List>

          <Title order={3}>Don&apos;ts</Title>
          <List
            spacing="sm"
            size="md"
            icon={
              <ThemeIcon color="red" size={24} radius="xl">
                <IconX size={16} />
              </ThemeIcon>
            }
          >
            <List.Item>Do not harass, bully, or threaten others.</List.Item>
            <List.Item>
              Do not post hate speech or discriminatory content.
            </List.Item>
            <List.Item>Do not share spam or misleading information.</List.Item>
            <List.Item>
              Do not upload copyrighted material without permission.
            </List.Item>
            <List.Item>
              Do not share personal or sensitive information of others.
            </List.Item>
          </List>

          <Text mt="xl">
            Violating these guidelines may result in content removal or account
            suspension. Let&apos;s work together to build a great community!
          </Text>
        </Stack>
      </Container>
    </>
  );
}
