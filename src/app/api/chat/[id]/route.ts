import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        
        // In a real app, we should verify that the requester is the author of the message.
        // Since we don't have session-based auth in the API route easily accessible without middleware,
        // we will assume the client is honest for this prototype, OR we could pass a userId in the body/query to verify.
        // Let's try to get userId from query to verify ownership.
        
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.senderId.toString() !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Message.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { action, userId, emoji } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (action === 'react') {
            if (!emoji) return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
            
            // Check if user already reacted with this emoji
            const existingReaction = message.reactions.find(
                (r: { userId: { toString: () => string }; emoji: string }) => r.userId.toString() === userId && r.emoji === emoji
            );

            if (existingReaction) {
                // Remove reaction (toggle off)
                message.reactions = message.reactions.filter(
                    (r: { userId: { toString: () => string }; emoji: string }) => !(r.userId.toString() === userId && r.emoji === emoji)
                );
            } else {
                // Add reaction
                message.reactions.push({ userId, emoji });
            }
        }

        await message.save();
        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error updating message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
