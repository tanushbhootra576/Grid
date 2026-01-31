"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container, Title, Text, Group, Button, Card } from "@mantine/core";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for debugging; full stack is available in server logs.
    console.error(error);
  }, [error]);

  return (
    <Container size="sm" py="xl">
      <Card withBorder radius="md" p="lg">
        <Title order={2} mb="xs">
          Couldn’t load this project
        </Title>
        <Text c="dimmed" mb="md">
          This is usually caused by a server/database configuration issue or a
          temporary outage. Please try again.
        </Text>
        <Group>
          <Button onClick={reset}>Try again</Button>
          <Button component={Link} href="/projects" variant="default">
            Back to Projects
          </Button>
        </Group>
      </Card>
    </Container>
  );
}
