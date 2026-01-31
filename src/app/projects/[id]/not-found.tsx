"use client";

import Link from "next/link";
import { Container, Title, Text, Button, Card } from "@mantine/core";

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Card withBorder radius="md" p="lg">
        <Title order={2} mb="xs">
          Project not found
        </Title>
        <Text c="dimmed" mb="md">
          The project may have been removed, or the link is incorrect.
        </Text>
        <Button component={Link} href="/projects" variant="light">
          Back to Projects
        </Button>
      </Card>
    </Container>
  );
}
