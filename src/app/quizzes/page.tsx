"use client";

import { Navbar } from '@/components/Navbar';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import g from '../grid.module.css';

const COMPANIES = [
    { id: 1, name: 'Google', role: 'SWE Intern', desc: 'DSA & System Design rounds', count: 12 },
    { id: 2, name: 'Microsoft', role: 'SDE', desc: 'Arrays, Strings, Trees & CS Fundamentals', count: 8 },
    { id: 3, name: 'Amazon', role: 'SDE-1', desc: 'Leadership Principles & Graphs', count: 15 },
    { id: 4, name: 'Meta', role: 'Frontend', desc: 'React, DOM Manipulation, CSS', count: 10 },
];

export default function QuizzesPage() {
    return (
        <>
            <Navbar />
            <div className={g.container}>
                <div className={g.headerRow} style={{ marginBottom: 32 }}>
                    <div>
                        <h1 className={g.title}>
                            <div className={g.titleAccent} />
                            Quizzes
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-space)' }}>Test your knowledge and prepare for interviews.</p>
                    </div>
                </div>

                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconBuildingSkyscraper size={24} color="#fff" />
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-space)', fontSize: '1.5rem', margin: 0 }}>Company-wise</h2>
                    </div>

                    <div className={g.grid}>
                        {COMPANIES.map(c => (
                            <div key={c.id} className={g.card}>
                                <div className={g.cardTop} style={{ background: 'var(--accent-2)' }} />
                                <div className={g.cardBody}>
                                    <div className={g.cardHeader}>
                                        <h3 className={g.cardTitle} style={{ marginBottom: 0 }}>{c.name}</h3>
                                        <span className={g.badge} style={{ borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}>{c.count} QUIZZES</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.85rem', color: 'var(--text)', marginBottom: 8, fontWeight: 600 }}>
                                        Target: {c.role}
                                    </div>
                                    <p className={g.cardDesc}>{c.desc}</p>
                                    
                                    <button className={g.btn} style={{ width: '100%', marginTop: 'auto' }}>
                                        START PRACTICING
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
