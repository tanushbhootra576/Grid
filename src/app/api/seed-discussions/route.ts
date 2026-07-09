import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import DiscussionThread from '@/models/DiscussionThread';

export async function GET() {
    try {
        await dbConnect();
        
        let admin = await User.findOne({ email: 'admin@camp.com' });
        if (!admin) admin = await User.findOne({});
        
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@camp.com',
                firebaseUid: 'dummy_admin_uid_' + Date.now(),
                role: 'admin',
            });
        }

        const threads = [
            {
                title: 'Is SWE a good career in 2026?',
                content: 'I have heard that AI is taking over many entry level roles. What are the best skills to focus on to stand out?',
                category: 'SWE',
                tags: ['career', 'ai', 'software-engineering'],
                authorId: admin._id
            },
            {
                title: 'How to prepare for Google Summer of Code?',
                content: 'Does anyone have a roadmap or tips on how to approach open source organizations for GSoC? I am comfortable in Python and React.',
                category: 'GENERAL',
                tags: ['gsoc', 'open-source', 'internships'],
                authorId: admin._id
            },
            {
                title: 'What are the best resources for Data Structures and Algorithms?',
                content: 'I struggle with dynamic programming. Are there any specific platforms or courses that really break it down well?',
                category: 'SWE',
                tags: ['dsa', 'interviews', 'dp'],
                authorId: admin._id
            },
            {
                title: 'Advice for 3rd Year Placements?',
                content: 'Our campus placements are starting in 6 months. Should I focus purely on LeetCode or build more full-stack projects?',
                category: 'PLACEMENT',
                tags: ['placements', 'advice', 'year3'],
                authorId: admin._id
            }
        ];

        await DiscussionThread.insertMany(threads);
        return NextResponse.json({ message: 'Discussions seeded successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
