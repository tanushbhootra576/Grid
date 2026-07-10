"use client";

import { Navbar } from '@/components/Navbar';
import g from '../grid.module.css';

export default function EventsPage() {
    return (
        <>
            <Navbar />
            <div className={g.container}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
                    <h1 className={g.title} style={{ marginBottom: 16 }}>Events</h1>
                    <h2 style={{ fontFamily: 'var(--font-space)', fontSize: '2rem', color: 'var(--accent)', marginBottom: 8 }}>Coming Soon</h2>
                    <p style={{ fontFamily: 'var(--font-space)', color: 'var(--text-muted)' }}>This section is under construction.</p>
                </div>
            </div>
        </>
    );
}
