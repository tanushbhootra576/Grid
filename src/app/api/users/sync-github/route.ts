import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let githubUsername = "";
    try {
      const { username } = await req.json();
      githubUsername = username;
    } catch {
      // fallback to user's saved github link if no username passed
      const ghLink = user.socialLinks?.github;
      if (ghLink) {
        const parts = ghLink.split("github.com/");
        if (parts.length > 1) {
          githubUsername = parts[1].split("/")[0];
        }
      }
    }

    if (!githubUsername) {
      return NextResponse.json(
        { error: "No GitHub username provided or found in profile" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Grid-App",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from GitHub API" },
        { status: 500 }
      );
    }

    const repos = await res.json();
    
    // Add top 5 repos to powProjects
    const existingUrls = new Set(user.powProjects.map((p: any) => p.url));
    let addedCount = 0;

    for (const repo of repos) {
      if (!existingUrls.has(repo.html_url)) {
        user.powProjects.push({
          title: repo.name,
          url: repo.html_url,
          description: repo.description || "Imported from GitHub",
          endorsements: [],
        });
        addedCount++;
      }
    }

    // Save back github link just in case
    if (!user.socialLinks) user.socialLinks = {};
    if (!user.socialLinks.github) {
        user.socialLinks.github = `https://github.com/${githubUsername}`;
    }

    await user.save();

    return NextResponse.json({ success: true, addedCount, powProjects: user.powProjects });
  } catch (error: any) {
    console.error("Github Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
