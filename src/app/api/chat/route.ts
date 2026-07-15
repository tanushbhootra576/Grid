import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import { validateContent } from "@/lib/moderation";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const year = searchParams.get("year");
    const userId = searchParams.get("userId");

    const recipientId = searchParams.get("recipientId");

    if (!type) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    // Update user's last active status if userId is provided
    if (userId && Types.ObjectId.isValid(userId)) {
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });
    }

    // Get online users count (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineCount = await User.countDocuments({
      lastActive: { $gte: fiveMinutesAgo },
    });
    const totalUsers = await User.countDocuments({});

    if (type === "conversations") {
      if (!userId)
        return NextResponse.json(
          { error: "User ID required" },
          { status: 400 }
        );
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }
      const userObjectId = new Types.ObjectId(userId);
      const currentUser = await User.findById(userId).select(
        "dmLastRead pinnedDms"
      );

      const lastReadMap = new Map<string, Date>();
      const dmLastRead: any = currentUser?.dmLastRead;
      if (dmLastRead) {
        if (dmLastRead instanceof Map) {
          dmLastRead.forEach((value: Date, key: string) => {
            if (value) lastReadMap.set(String(key), new Date(value));
          });
        } else {
          Object.entries(dmLastRead).forEach(([key, value]) => {
            if (value) lastReadMap.set(String(key), new Date(value as any));
          });
        }
      }

      const conversationDocs = await Message.aggregate([
        {
          $match: {
            type: "dm",
            $or: [{ senderId: userObjectId }, { recipientId: userObjectId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", userObjectId] },
                "$recipientId",
                "$senderId",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
          },
        },
        { $match: { _id: { $ne: null } } },
      ]);

      const otherUserIds = conversationDocs
        .map((doc: any) => doc._id)
        .filter(Boolean)
        .map((id: Types.ObjectId) => id.toString());

      if (otherUserIds.length === 0) {
        return NextResponse.json(
          { conversations: [], totalUnread: 0 },
          { status: 200 }
        );
      }

      const users = await User.find({ _id: { $in: otherUserIds } }).select(
        "name _id publicId photoURL"
      );

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));
      const pinnedList = (currentUser?.pinnedDms || []).map((id: any) =>
        String(id)
      );
      const pinnedSet = new Set(pinnedList);

      const unreadMessages = await Message.find({
        type: "dm",
        recipientId: userObjectId,
        senderId: { $in: otherUserIds.map((id) => new Types.ObjectId(id)) },
      }).select("senderId createdAt");

      const unreadCountMap: Record<string, number> = {};
      unreadMessages.forEach((msg) => {
        const senderIdStr = msg.senderId?.toString();
        if (!senderIdStr) return;
        const lastRead = lastReadMap.get(senderIdStr);
        if (!lastRead || msg.createdAt > lastRead) {
          unreadCountMap[senderIdStr] = (unreadCountMap[senderIdStr] || 0) + 1;
        }
      });

      const conversations = conversationDocs
        .map((doc: any) => {
          const otherId = doc._id?.toString();
          if (!otherId) return null;
          const userDetails: any = userMap.get(otherId);
          const lastMessage = doc.lastMessage;
          const lastMessageAt = lastMessage?.createdAt
            ? new Date(lastMessage.createdAt).toISOString()
            : null;
          return {
            _id: otherId,
            name: userDetails?.name || "Unknown",
            photoURL: userDetails?.photoURL,
            publicId: userDetails?.publicId,
            unreadCount: unreadCountMap[otherId] || 0,
            lastMessagePreview: lastMessage?.sticker
              ? "🖼 Sticker"
              : lastMessage?.content || "",
            lastMessageAt,
            isPinned: pinnedSet.has(otherId),
          };
        })
        .filter(Boolean);

      conversations.sort((a: any, b: any) => {
        if (a.isPinned && b.isPinned) {
          return pinnedList.indexOf(a._id) - pinnedList.indexOf(b._id);
        }
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      const totalUnread = conversations.reduce(
        (sum, conv: any) => sum + (conv.unreadCount || 0),
        0
      );

      return NextResponse.json({ conversations, totalUnread }, { status: 200 });
    }

    let query: any = { type };
    if (type === "year") {
      if (!year)
        return NextResponse.json({ error: "Year required" }, { status: 400 });
      query.year = Number(year);
    } else if (type === "dm") {
      if (!userId || !recipientId)
        return NextResponse.json(
          { error: "User ID and Recipient ID required for DM" },
          { status: 400 }
        );
      query = {
        type: "dm",
        $or: [
          { senderId: userId, recipientId: recipientId },
          { senderId: recipientId, recipientId: userId },
        ],
      };
    }

    const totalMessages = await Message.countDocuments(query);

    const messages = await Message.find(query)
      .sort({ createdAt: 1 }) // Oldest first
      .limit(100); // Limit to last 100 messages

    if (
      type === "dm" &&
      userId &&
      recipientId &&
      Types.ObjectId.isValid(userId) &&
      Types.ObjectId.isValid(recipientId)
    ) {
      await User.findByIdAndUpdate(userId, {
        $set: { [`dmLastRead.${recipientId}`]: new Date() },
      });
    }

    return NextResponse.json(
      { messages, onlineCount, totalUsers, totalMessages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      content,
      senderId,
      type,
      year,
      replyTo,
      sticker,
      recipientId,
    } = body;

    if ((!content && !sticker) || !senderId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify sender exists and get name
    const sender = await User.findById(senderId);
    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for blocks in DM
    if (type === "dm" && recipientId) {
      const recipient = await User.findById(recipientId);
      if (recipient) {
        // Check if recipient has blocked sender
        if (recipient.blockedUsers?.includes(senderId)) {
          return NextResponse.json(
            { error: "Message not sent: You have been blocked by this user." },
            { status: 403 }
          );
        }
        // Check if sender has blocked recipient
        if (sender.blockedUsers?.includes(recipientId)) {
          return NextResponse.json(
            {
              error:
                "Message not sent: You have blocked this user. Unblock them to send messages.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Moderation check
    if (content) {
      try {
        await validateContent(content, "message");
      } catch (modError: any) {
        return NextResponse.json({ error: modError.message }, { status: 400 });
      }
    }

    // Verify year match
    if (sender.role === "student") {
      if (type === "year") {
        if (!year)
          return NextResponse.json(
            { error: "Year is required" },
            { status: 400 }
          );

        // Allow if sender.year is missing (legacy users) or matches
        if (sender.year && Number(sender.year) !== Number(year)) {
          return NextResponse.json(
            {
              error: `Wrong year. You are in Year ${sender.year}, but trying to post to Year ${year}`,
            },
            { status: 403 }
          );
        }
      }
    } else if (type === "dm") {
      if (!recipientId)
        return NextResponse.json(
          { error: "Recipient ID is required for DM" },
          { status: 400 }
        );
    }

    const messageData: any = {
      content: content || "",
      senderId,
      senderName: type === 'blind' ? 'Anonymous' : sender.name,
      senderVerified: sender.verified || false,
      type,
      year: type === "year" ? year : undefined,
      recipientId: type === "dm" ? recipientId : undefined,
      sticker,
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    const message = await Message.create(messageData);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
