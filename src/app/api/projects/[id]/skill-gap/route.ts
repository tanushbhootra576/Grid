import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const requiredSkills = project.techStack || [];
    const skillCount = requiredSkills.length;

    // --- Difficulty Logic ---
    // Since we don't have explicit levels, we assume base level = 1
    // difficultyScore = requiredSkills.length * averageSkillLevel (1)
    const difficultyScore = skillCount;

    let difficulty = "Beginner";
    if (difficultyScore >= 8) difficulty = "Advanced";
    else if (difficultyScore >= 5) difficulty = "Intermediate";

    // --- Friendly Logic ---
    // beginnerFriendly: if difficulty === Beginner
    const beginnerFriendly = difficulty === "Beginner";

    // learningFriendly: avgSkillLevel <= 1.5. Since assumed level is 1, this is always true
    // unless we want to change logic. Let's stick to the rule.
    const learningFriendly = true;

    // --- Team Size Logic ---
    const teamSize = project.teamMembers ? project.teamMembers.length : 0;
    let teamSizeLabel = "Small";
    if (teamSize >= 7) teamSizeLabel = "Large";
    else if (teamSize >= 4) teamSizeLabel = "Medium";

    // --- Project Health Logic ---
    // Active (activity within 7 days), Quiet (7-30), Dormant (30+)
    // Try to fetch real activity from GitHub if available, otherwise fallback to createdAt
    let lastActivity = project.createdAt;

    if (project.repoLink && project.repoLink.includes("github.com")) {
      try {
        // Parse "https://github.com/owner/repo" -> owner, repo
        const urlParts = project.repoLink.split("github.com/");
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split("/").filter(Boolean);
          if (pathParts.length >= 2) {
            const owner = pathParts[0];
            const repo = pathParts[1].replace(".git", "");

            // Fetch repo details to get pushed_at
            const headers: HeadersInit = {
              "User-Agent": "Project-Analyzer-App",
              Accept: "application/vnd.github.v3+json",
            };

            if (process.env.GITHUB_ACCESS_TOKEN) {
              headers[
                "Authorization"
              ] = `token ${process.env.GITHUB_ACCESS_TOKEN}`;
            }

            // Note: Unauthenticated requests are limited to 60/hr
            const ghRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
              {
                headers,
              }
            );

            if (ghRes.ok) {
              const ghData = await ghRes.json();
              if (ghData.pushed_at) {
                lastActivity = ghData.pushed_at;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch GitHub activity:", err);
        // Continue using createdAt as fallback
      }
    }

    const daysSinceActivity =
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);

    let projectHealth = "Active";
    if (daysSinceActivity > 30) projectHealth = "Dormant";
    else if (daysSinceActivity > 7) projectHealth = "Quiet";

    return NextResponse.json({
      difficulty,
      difficultyScore,
      beginnerFriendly,
      learningFriendly,
      teamSizeLabel,
      projectHealth,
      estimatedDuration: "Variable", // Placeholder or derived from complexity
    });
  } catch (error) {
    console.error("Project Analyzer API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
