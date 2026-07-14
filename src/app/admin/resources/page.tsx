'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import { showSuccess, showError } from '@/lib/error-handling';
import { getAuthHeaders } from '@/lib/api';
import g from '../../grid.module.css';

interface PendingItem {
    resourceId: string;
    courseCode: string;
    category: 'COURSE' | 'SYLLABUS' | 'NOTES' | 'PYQ' | 'OTHER';
    itemId?: string;
    title: string;
    linkUrl: string;
    uploaderName: string;
    date: string;
}

export default function AdminResourcesPage() {
    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/resources', { headers: getAuthHeaders() });
            const data = await res.json();
            
            if (res.ok) {
                const flattened: PendingItem[] = [];
                data.resources.forEach((r: any) => {
                    const uploader = r.uploaderId?.name || 'Unknown';
                    
                    if (r.isApproved === false) {
                        flattened.push({
                            resourceId: r._id,
                            courseCode: r.courseCode,
                            category: 'COURSE',
                            title: `New Course: ${r.courseName}`,
                            linkUrl: '',
                            uploaderName: uploader,
                            date: r.createdAt
                        });
                    }

                    if (r.syllabus && r.syllabus.isApproved === false) {
                        flattened.push({
                            resourceId: r._id,
                            courseCode: r.courseCode,
                            category: 'SYLLABUS',
                            title: 'Syllabus',
                            linkUrl: r.syllabus.linkUrl,
                            uploaderName: uploader,
                            date: r.createdAt 
                        });
                    }

                    r.modules?.forEach((m: any) => {
                        if (m.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'NOTES',
                                itemId: m._id,
                                title: m.title,
                                linkUrl: m.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });

                    r.pyqs?.forEach((p: any) => {
                        if (p.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'PYQ',
                                itemId: p._id,
                                title: `${p.exam} ${p.year}`,
                                linkUrl: p.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });

                    r.others?.forEach((o: any) => {
                        if (o.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'OTHER',
                                itemId: o._id,
                                title: o.title,
                                linkUrl: o.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });
                });
                setItems(flattened);
            }
        } catch (error) {
            console.error(error);
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (item: PendingItem, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch('/api/admin/resources/action', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: item.resourceId,
                    category: item.category,
                    itemId: item.itemId,
                    action
                })
            });
            
            if (res.ok) {
                showSuccess(`Item ${action.toLowerCase()}d successfully`);
                setItems(prev => prev.filter(i => i !== item));
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Action failed' });
            }
        } catch (error) {
            showError(error);
        }
    };

    return (
        <>
            <Navbar />
            <div className={g.container} style={{ paddingTop: 100, paddingBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-space)', fontSize: '2rem', marginBottom: 32 }}>Pending Resource Approvals</h2>
                
                {loading ? (
                    <div className="squareSpinner" style={{ margin: '40px auto' }} />
                ) : items.length === 0 ? (
                    <div className={g.card} style={{ height: 'auto', border: '1px solid var(--border)', padding: 32, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No pending resources found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {items.map((item, index) => (
                            <div key={index} className={g.card} style={{ height: 'auto', border: '1px solid var(--border)', padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className={g.badge} style={{ background: 'var(--accent)', color: '#fff' }}>{item.courseCode}</span>
                                            <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)', border: '1px solid var(--border)' }}>{item.category}</span>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>by {item.uploaderName}</span>
                                        </div>
                                        
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</div>
                                        
                                        {item.linkUrl && (
                                            <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.95rem', textDecoration: 'none' }}>
                                                <IconExternalLink size={16} /> View Resource
                                            </a>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button 
                                            className={g.btn} 
                                            style={{ padding: 12, color: 'red', border: '1px solid red' }} 
                                            onClick={() => handleAction(item, 'REJECT')}
                                            title="Reject"
                                        >
                                            <IconX size={20} />
                                        </button>
                                        <button 
                                            className={`${g.btn} ${g.btnPrimary}`} 
                                            style={{ padding: 12, background: 'green' }} 
                                            onClick={() => handleAction(item, 'APPROVE')}
                                            title="Approve"
                                        >
                                            <IconCheck size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
