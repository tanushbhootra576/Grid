import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Image,
  SimpleGrid,
  Card,
  Avatar,
  Stack,
  ThemeIcon,
  Box,
  ScrollArea,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconExternalLink,
  IconArrowLeft,
  IconUsers,
  IconCalendar,
  IconFileText,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { SkillGapAnalyzer } from "@/components/SkillGapAnalyzer";
import {
  CollaborationBadge,
  CollaborationLevel,
} from "@/components/CollaborationStatus"; // IMPORT ADDED

// Force dynamic rendering if we rely on request headers/cookies implicitly or data changes often
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProjectReadme(repoLink?: string) {
  if (!repoLink || !repoLink.includes("github.com")) return null;

  try {
    const urlParts = repoLink.split("github.com/");
    if (urlParts.length <= 1) return null;

    const pathParts = urlParts[1].split("/").filter(Boolean);
    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1].replace(".git", "");

    // Use the API to find the README (handles default branch detection)
    // We use the raw media type to get the content directly
    // Not using AUTH TOKEN as requested, so limited to 60 req/hr from this IP
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "Project-Analyzer-App",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) return null;
    return await res.text();
  } catch (error) {
    console.error("Failed to fetch README:", error);
    return null;
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  await dbConnect();

  let project = null;
  try {
    project = await Project.findById(id)
      .populate("teamMembers", "name email firebaseUid collaborationStatus")
      .lean();
  } catch (e) {
    console.error("Failed to fetch project", e);
  }

  if (!project) {
    notFound();
  }

  // Serialize _id and dates for client components if needed
  const projectId = project._id.toString();
  const createdAt = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "";

  // Fetch readme content if available
  const readmeContent = await getProjectReadme(project.repoLink);

  return (
    <>
      <Navbar />
      <Container size="lg" py="xl">
        <Box mb="xl">
          <Link href="/projects" style={{ textDecoration: "none" }}>
            <Button
              component="span"
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Projects
            </Button>
          </Link>
        </Box>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
          <Stack style={{ gridColumn: "span 2" }}>
            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between" align="start">
                <div>
                  <Title order={2} mb="xs">
                    {project.title}
                  </Title>
                  <Group gap="xs">
                    {project.isFeatured && (
                      <Badge color="yellow">Featured</Badge>
                    )}
                    <Badge variant="dot" color="gray">
                      {createdAt}
                    </Badge>
                  </Group>
                </div>
                <Group>
                  {project.repoLink && (
                    <Button
                      component="a"
                      href={project.repoLink}
                      target="_blank"
                      variant="default"
                      leftSection={<IconBrandGithub size={18} />}
                    >
                      Code
                    </Button>
                  )}
                  {project.demoLink && (
                    <Button
                      component="a"
                      href={project.demoLink}
                      target="_blank"
                      variant="filled"
                      leftSection={<IconExternalLink size={18} />}
                    >
                      Live Demo
                    </Button>
                  )}
                </Group>
              </Group>

              <Group mt="lg" gap="xs">
                {project.techStack?.map((tech: string) => (
                  <Badge key={tech} size="lg" variant="outline">
                    {tech}
                  </Badge>
                ))}
              </Group>

              <Text mt="xl" size="lg" style={{ whiteSpace: "pre-wrap" }}>
                {project.description}
              </Text>

              {project.images && project.images.length > 0 && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xl">
                  {project.images.map((img: string, idx: number) => (
                    <Image
                      key={idx}
                      src={img}
                      radius="md"
                      alt={`Project image ${idx + 1}`}
                    />
                  ))}
                </SimpleGrid>
              )}

              {readmeContent && (
                <Card withBorder radius="md" mt="xl" padding="lg">
                  <Group mb="md">
                    <ThemeIcon variant="light" size="lg" color="dark">
                      <IconFileText size={20} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">
                      README.md
                    </Text>
                  </Group>

                  <Box
                    style={{
                      // Use a lighter gray background and code styling
                      backgroundColor: "#f8f9fa",
                      color: "#24292e", // Ensure text is dark to contrast with light bg
                      padding: "1rem",
                      borderRadius: "8px",
                      overflowX: "auto",
                    }}
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>{readmeContent}</ReactMarkdown>
                    </div>
                  </Box>
                </Card>
              )}
            </Card>
          </Stack>

          <Stack>
            <SkillGapAnalyzer projectId={projectId} />

            <Card withBorder radius="md" padding="lg">
              <Group mb="md">
                <ThemeIcon variant="light" size="lg">
                  <IconUsers size={20} />
                </ThemeIcon>
                <Text fw={600}>Team Members</Text>
              </Group>
              <Stack gap="sm">
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  project.teamMembers.map((member: any) => (
                    <Group key={member._id.toString()}>
                      <Avatar color="initials" name={member.name} />
                      <div>
                        <Group gap={6}>
                          <Text size="sm" fw={500}>
                            {member.name || "Unknown User"}
                          </Text>
                          {member.collaborationStatus?.visible && (
                            <CollaborationBadge
                              level={
                                member.collaborationStatus
                                  .level as CollaborationLevel
                              }
                              size="xs"
                            />
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          Contributor
                        </Text>
                      </div>
                    </Group>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">
                    No members listed
                  </Text>
                )}
              </Stack>
            </Card>
          </Stack>
        </SimpleGrid>
      </Container>
    </>
  );
}
