import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, projectIndex } = await req.json();

    if (!targetUserId || projectIndex === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (!targetUser.powProjects || !targetUser.powProjects[projectIndex]) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = targetUser.powProjects[projectIndex];
    const endorserId = currentUser._id.toString();

    const endorsementIndex = project.endorsements.indexOf(endorserId);

    if (endorsementIndex > -1) {
      // Remove endorsement
      project.endorsements.splice(endorsementIndex, 1);
    } else {
      // Add endorsement
      project.endorsements.push(endorserId);
    }

    await targetUser.save();

    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error: any) {
    console.error("Error toggling endorsement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
