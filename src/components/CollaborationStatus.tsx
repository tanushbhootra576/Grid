"use client";

import {
  Slider,
  Text,
  Box,
  Group,
  Switch,
  Card,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import {
  IconRocket,
  IconSearch,
  IconBulb,
  IconUsers,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";

export type CollaborationLevel = 0 | 1 | 2 | 3;

interface CollaborationStatusProps {
  level: CollaborationLevel;
  visible: boolean;
  onChange: (level: CollaborationLevel, visible: boolean) => void;
  readonly?: boolean;
}

export const STATUS_CONFIG = [
  {
    value: 0,
    label: "Not Looking",
    description: "Currently focusing on studies or personal work.",
    color: "gray",
    icon: IconBulb,
  },
  {
    value: 1,
    label: "Exploring",
    description: "Open to ideas and browsing interesting projects.",
    color: "blue",
    icon: IconSearch,
  },
  {
    value: 2,
    label: "Learning",
    description: "Looking for a team to learn new skills with.",
    color: "teal",
    icon: IconBulb,
  },
  {
    value: 3,
    label: "Looking for Co-founder",
    description: "Actively seeking co-founders to build a startup or major project.",
    color: "orange",
    icon: IconRocket,
  },
];

interface CollaborationBadgeProps {
  level: CollaborationLevel;
  size?: string;
}

export function CollaborationBadge({
  level,
  size = "sm",
}: CollaborationBadgeProps) {
  const config =
    STATUS_CONFIG.find((c) => c.value === level) || STATUS_CONFIG[1];
  return (
    <Badge color={config.color} variant="light" size={size} radius="sm">
      {config.label}
    </Badge>
  );
}

export function CollaborationStatus({
  level,
  visible,
  onChange,
  readonly = false,
}: CollaborationStatusProps) {
  // Local state for smooth slider interaction
  const [localLevel, setLocalLevel] = useState<number>(level);

  useEffect(() => {
    setLocalLevel(level);
  }, [level]);

  const currentStatus =
    STATUS_CONFIG.find((s) => s.value === localLevel) || STATUS_CONFIG[1];
  const Icon = currentStatus.icon;

  if (readonly && !visible) return null;

  if (readonly) {
    return (
      <Card withBorder padding="sm" radius="md">
        <Group>
          <ThemeIcon variant="light" size="lg" color={currentStatus.color}>
            <Icon size={20} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700} c={`${currentStatus.color}.8`} style={{ fontFamily: "var(--font-space)" }}>
              {currentStatus.label}
            </Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: "var(--font-space)" }}>
              {currentStatus.description}
            </Text>
          </div>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="sm" style={{ fontFamily: "var(--font-space)" }}>
          Collaboration Status
        </Text>
        <Switch
          label="Visible on Profile"
          size="xs"
          checked={visible}
          onChange={(e) => onChange(level, e.currentTarget.checked)}
          styles={{ label: { fontFamily: "var(--font-space)" } }}
        />
      </Group>

      <Box px="xs" mb="lg">
        <Slider
          value={localLevel}
          onChange={setLocalLevel}
          onChangeEnd={(val) => onChange(val as CollaborationLevel, visible)}
          min={0}
          max={3}
          step={1}
          label={null}
          marks={STATUS_CONFIG.map((s) => ({ value: s.value }))} // Only dots, no text labels on track to keep it clean
          styles={(theme) => ({
            track: { backgroundColor: theme.colors.gray[2] },
            bar: { backgroundColor: theme.colors[currentStatus.color][6] },
            thumb: { borderColor: theme.colors[currentStatus.color][6] },
          })}
        />
      </Box>

      <Group align="flex-start" wrap="nowrap">
        <ThemeIcon
          variant="light"
          size="xl"
          radius="md"
          color={currentStatus.color}
        >
          <Icon size={22} />
        </ThemeIcon>
        <div>
          <Text fw={700} size="md" c={`${currentStatus.color}.9`} style={{ fontFamily: "var(--font-space)" }}>
            {currentStatus.label}
          </Text>
          <Text size="sm" c="dimmed" lh={1.4} style={{ fontFamily: "var(--font-space)" }}>
            {currentStatus.description}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
