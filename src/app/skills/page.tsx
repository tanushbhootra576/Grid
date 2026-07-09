'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { IconSearch, IconPlus, IconBrandGmail, IconBrandWindows, IconBrandYahoo, IconMail, IconX } from '@tabler/icons-react';
import { showError } from '@/lib/error-handling';
import { getAuthHeaders } from '@/lib/api';
import g from '../grid.module.css';

interface Skill {
    _id: string;
    title: string;
    description: string;
    type: 'OFFER' | 'REQUEST';
    category: 'ACADEMIC' | 'NON_ACADEMIC';
    status: 'OPEN' | 'CLOSED';
    tags: string[];
    userId?: {
        _id: string;
        name?: string;
        email?: string;
        branch?: string;
        year?: number;
    } | string | null;
    createdAt: string;
}

export default function SkillsPage() {
    const { user, profile } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    const [opened, setOpened] = useState(false);
    const [contactOpened, setContactOpened] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    const [newSkill, setNewSkill] = useState({
        title: '',
        description: '',
        type: 'OFFER',
        category: 'ACADEMIC',
        tags: '',
    });

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (typeFilter) params.append('type', typeFilter);

            const res = await fetch(`/api/skills?${params.toString()}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setSkills(data.skills);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [search, typeFilter]);

    const handleSubmit = async () => {
        if (!profile) {
            alert('Please complete your profile before posting a skill.');
            return;
        }
        try {
            const res = await fetch('/api/skills', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...newSkill,
                    userId: profile._id,
                    tags: newSkill.tags.split(',').map(t => t.trim()).filter(t => t),
                }),
            });

            if (res.ok) {
                setOpened(false);
                fetchSkills();
                setNewSkill({ title: '', description: '', type: 'OFFER', category: 'ACADEMIC', tags: '' });
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Failed to create skill listing' }, 'Creation Failed');
            }
        } catch (error) {
            showError(error, 'Creation Failed');
        }
    };

    return (
        <>
            <Navbar />
            <div className={g.container}>
                <div className={g.headerRow}>
                    <h1 className={g.title}>
                        <div className={g.titleAccent} />
                        Skill Exchange
                    </h1>
                    {user && (
                        <button className={`${g.btn} ${g.btnPrimary}`} onClick={() => setOpened(true)}>
                            <IconPlus size={18} /> POST LISTING
                        </button>
                    )}
                </div>

                <div className={g.controlsRow}>
                    <div className={g.inputGroup}>
                        <IconSearch size={18} className={g.inputIcon} />
                        <input
                            type="text"
                            className={g.input}
                            placeholder="Search skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className={g.select}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="OFFER">Offers</option>
                        <option value="REQUEST">Requests</option>
                    </select>
                </div>

                {loading ? (
                    <div className={g.spinner} />
                ) : (
                    <div className={g.grid}>
                        {skills.map((skill) => {
                            const skillUser = (skill.userId && typeof skill.userId === 'object') ? skill.userId : null;
                            const isOwner = profile && skillUser && String(skillUser._id) === String(profile._id);

                            return (
                                <div key={skill._id} className={`${g.card} ${skill.type === 'OFFER' ? g.offer : g.request}`}>
                                    <div className={g.cardTop} />
                                    <div className={g.cardBody}>
                                        <div className={g.cardHeader}>
                                            <div className={g.badgeRow}>
                                                <span className={`${g.badge} ${skill.type === 'OFFER' ? g.offer : g.request}`}>
                                                    {skill.type}
                                                </span>
                                                <span className={g.badge}>{skill.category}</span>
                                            </div>
                                        </div>

                                        <h3 className={g.cardTitle}>{skill.title}</h3>
                                        <p className={g.cardDesc}>{skill.description}</p>

                                        <div className={g.tagList}>
                                            {skill.tags.map(tag => (
                                                <span key={tag} className={g.tag}>{tag}</span>
                                            ))}
                                        </div>

                                        <div className={g.cardFooter}>
                                            <div className={g.author}>
                                                {skillUser?.name ? (
                                                    <>By <strong>{skillUser.name}</strong> {skillUser.branch && `(${skillUser.branch})`}</>
                                                ) : 'Unknown User'}
                                            </div>
                                            
                                            {skillUser?.email && (
                                                <button
                                                    className={g.btn}
                                                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                    onClick={() => {
                                                        setSelectedSkill(skill);
                                                        setContactOpened(true);
                                                    }}
                                                    disabled={skill.status === 'CLOSED'}
                                                >
                                                    {skill.status === 'CLOSED' ? 'CLOSED' : 'CONTACT'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {skills.length === 0 && (
                            <div className={g.empty}>No skills found matching your criteria.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Post Modal */}
            {opened && (
                <div className={g.modalBackdrop}>
                    <div className={g.modal}>
                        <div className={g.modalHeader}>
                            <h2 className={g.modalTitle}>Post Listing</h2>
                            <button className={g.closeBtn} onClick={() => setOpened(false)}><IconX size={24} /></button>
                        </div>
                        <div className={g.modalBody}>
                            <div className={g.formGroup}>
                                <label className={g.label}>Title</label>
                                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newSkill.title} onChange={e => setNewSkill({...newSkill, title: e.target.value})} placeholder="e.g. Photography for Events" />
                            </div>
                            <div className={g.formGroup}>
                                <label className={g.label}>Type</label>
                                <select className={g.select} value={newSkill.type} onChange={e => setNewSkill({...newSkill, type: e.target.value as any})}>
                                    <option value="OFFER">Offer (I can teach/do this)</option>
                                    <option value="REQUEST">Request (I want to learn/need this)</option>
                                </select>
                            </div>
                            <div className={g.formGroup}>
                                <label className={g.label}>Category</label>
                                <select className={g.select} value={newSkill.category} onChange={e => setNewSkill({...newSkill, category: e.target.value as any})}>
                                    <option value="ACADEMIC">Academic</option>
                                    <option value="NON_ACADEMIC">Non-Academic</option>
                                </select>
                            </div>
                            <div className={g.formGroup}>
                                <label className={g.label}>Description</label>
                                <textarea className={`${g.input} ${g.textarea}`} style={{border: '1px solid var(--border)'}} value={newSkill.description} onChange={e => setNewSkill({...newSkill, description: e.target.value})} placeholder="Describe what you're offering or looking for..." />
                            </div>
                            <div className={g.formGroup}>
                                <label className={g.label}>Tags</label>
                                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newSkill.tags} onChange={e => setNewSkill({...newSkill, tags: e.target.value})} placeholder="comma, separated, tags" />
                            </div>
                            <button className={`${g.btn} ${g.btnPrimary}`} style={{marginTop: 10}} onClick={handleSubmit}>POST LISTING</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {contactOpened && selectedSkill && (
                <div className={g.modalBackdrop}>
                    <div className={g.modal}>
                        <div className={g.modalHeader}>
                            <h2 className={g.modalTitle}>Contact Options</h2>
                            <button className={g.closeBtn} onClick={() => setContactOpened(false)}><IconX size={24} /></button>
                        </div>
                        <div className={g.modalBody}>
                            <p style={{fontFamily: 'var(--font-dm)', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                                Choose how you want to contact <strong>{typeof selectedSkill.userId === 'object' && selectedSkill.userId?.name ? selectedSkill.userId.name : 'the user'}</strong>:
                            </p>
                            
                            <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${typeof selectedSkill.userId === 'object' ? selectedSkill.userId?.email : ''}&su=Regarding your skill listing: ${selectedSkill.title}`} target="_blank" rel="noreferrer" className={g.btn}>
                                <IconBrandGmail size={20} /> Gmail
                            </a>
                            <a href={`https://outlook.office.com/mail/deeplink/compose?to=${typeof selectedSkill.userId === 'object' ? selectedSkill.userId?.email : ''}&subject=Regarding your skill listing: ${selectedSkill.title}`} target="_blank" rel="noreferrer" className={g.btn}>
                                <IconBrandWindows size={20} /> Outlook
                            </a>
                            <a href={`https://compose.mail.yahoo.com/?to=${typeof selectedSkill.userId === 'object' ? selectedSkill.userId?.email : ''}&subject=Regarding your skill listing: ${selectedSkill.title}`} target="_blank" rel="noreferrer" className={g.btn}>
                                <IconBrandYahoo size={20} /> Yahoo Mail
                            </a>
                            <a href={`mailto:${typeof selectedSkill.userId === 'object' ? selectedSkill.userId?.email : ''}?subject=Regarding your skill listing: ${selectedSkill.title}`} className={g.btn}>
                                <IconMail size={20} /> Default Mail App
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
