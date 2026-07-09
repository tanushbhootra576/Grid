import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiscussionThread from '@/models/DiscussionThread';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string, commentId: string }> | { id: string, commentId: string } }) {
  try {
    await dbConnect();
    const resolved = 'then' in context.params ? await context.params : context.params;
    const { id, commentId } = resolved;
    
    // Check if the user is authenticated (using userId query param or body)
    // Wait, DELETE body is generally not used, so maybe we use URL params or auth headers
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const thread = await DiscussionThread.findById(id);
    if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const commentIndex = thread.comments.findIndex((c: any) => String(c._id) === commentId);
    if (commentIndex === -1) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    const comment = thread.comments[commentIndex];

    const user = await User.findById(userId);
    const isThreadAuthor = String(thread.authorId) === userId;
    const isCommentAuthor = String(comment.authorId) === userId;
    const isAdmin = user?.role === 'admin';

    if (!isThreadAuthor && !isCommentAuthor && !isAdmin) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    thread.comments.splice(commentIndex, 1);
    await thread.save();

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[discussions.DELETE comment] Error', msg);
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}
