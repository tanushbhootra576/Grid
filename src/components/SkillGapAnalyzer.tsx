"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Loader,
  Title,
  SimpleGrid,
} from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { getAuthHeaders } from "@/lib/api";

interface ProjectAnalysis {
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  difficultyScore: number;
  beginnerFriendly: boolean;
  learningFriendly: boolean;
  teamSizeLabel: "Small" | "Medium" | "Large";
  projectHealth: "Active" | "Quiet" | "Dormant";
  estimatedDuration: string;
}

interface SkillGapAnalyzerProps {
  projectId: string;
}

export function SkillGapAnalyzer({ projectId }: SkillGapAnalyzerProps) {
  const { user } = useAuth();
  const [data, setData] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectAnalysis = async () => {
      if (!user || !projectId) return;

      setLoading(true);
      try {
        // No userId param needed now
        const res = await fetch(`/api/projects/${projectId}/skill-gap`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to analyze project");
        }

        const result = await res.json();
        setData(result);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Could not load project analysis");
      } finally {
        setLoading(false);
      }
    };

    // We run only if user is logged in (to get headers mostly, though API might not need it for public data
    // but let's keep it safe)
    if (user) {
      fetchProjectAnalysis();
    }
  }, [projectId, user]);

  if (!user)
    return (
      <Text size="sm" c="dimmed">
        Log in to view project analysis.
      </Text>
    );
  if (loading) return <Loader size="sm" />;
  if (error)
    return (
      <Text c="red" size="sm">
        {error}
      </Text>
    );
  if (!data) return null;

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Beginner":
        return "green";
      case "Intermediate":
        return "yellow";
      case "Advanced":
        return "red";
      default:
        return "gray";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Active":
        return "green";
      case "Quiet":
        return "yellow";
      case "Dormant":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <Card withBorder padding="lg" radius="md" mt="md">
      <Title order={4} mb="md">
        Project Overview
      </Title>

      <Stack gap="md">
        <Group>
          <Badge size="lg" color={getDifficultyColor(data.difficulty)}>
            {data.difficulty}
          </Badge>

          {data.beginnerFriendly && (
            <Badge variant="light" color="green">
              Beginner Friendly
            </Badge>
          )}
          {data.learningFriendly && (
            <Badge variant="light" color="blue">
              Great for Learning
            </Badge>
          )}
        </Group>

        <SimpleGrid cols={2} mt="xs">
          <div>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Project Health
            </Text>
            <Badge
              variant="dot"
              color={getHealthColor(data.projectHealth)}
              size="lg"
              mt={4}
            >
              {data.projectHealth}
            </Badge>
          </div>
          <div>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Team Size
            </Text>
            <Text fw={500} size="sm" mt={4}>
              {data.teamSizeLabel} Team
            </Text>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
