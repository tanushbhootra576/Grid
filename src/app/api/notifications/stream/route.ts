import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import dbConnect from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = user._id.toString();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      let lastUnreadCount = -1;

      const interval = setInterval(async () => {
        try {
          const db = mongoose.connection.db;
          if (!db) return;

          // Check for unread DMs
          const myMessages = await db.collection('messages').find({
            type: 'dm',
            recipientId: userId,
          }).toArray();

          const dmLastRead = user.dmLastRead || {};
          let totalUnread = 0;
          const notifications: any[] = [];

          const groupedBySender: Record<string, any[]> = {};
          myMessages.forEach(msg => {
            const sid = msg.senderId.toString();
            if (!groupedBySender[sid]) groupedBySender[sid] = [];
            groupedBySender[sid].push(msg);
          });

          for (const senderId in groupedBySender) {
            const msgs = groupedBySender[senderId];
            const lastRead = dmLastRead[senderId] ? new Date(dmLastRead[senderId]).getTime() : 0;
            const unreadMsgs = msgs.filter(m => new Date(m.createdAt).getTime() > lastRead);
            if (unreadMsgs.length > 0) {
              totalUnread += unreadMsgs.length;
              notifications.push({
                id: `dm_${senderId}`,
                type: 'message',
                message: `You have ${unreadMsgs.length} new message(s) from ${unreadMsgs[0].senderName}`,
                link: `/chat?dm=${senderId}`,
                time: unreadMsgs[unreadMsgs.length - 1].createdAt
              });
            }
          }

          if (totalUnread !== lastUnreadCount) {
            lastUnreadCount = totalUnread;
            const payload = {
              type: 'notification',
              unreadCount: totalUnread,
              notifications: notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } else {
            // Heartbeat
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
          }
        } catch (e) {
          console.error('SSE Error:', e);
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
