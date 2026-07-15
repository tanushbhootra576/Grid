"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { IconMessage, IconMail, IconExternalLink, IconShieldCheck } from "@tabler/icons-react";
import { getAuthHeaders } from "@/lib/api";
import { CollaborationStatus, CollaborationLevel } from "@/components/CollaborationStatus";
import g from "../../grid.module.css";


interface UserDetail {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  year?: number;
  bio?: string;
  skills: string[];
  interests: string[];
  verified?: boolean;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  collaborationStatus?: {
    level: CollaborationLevel;
    visible: boolean;
  };
  role: string;
  powProjects?: {
    title: string;
    url: string;
    description?: string;
    endorsements: string[];
  }[];
}


export default function UserProfileView() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string | undefined;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${uid}`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        setUser(json.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid]);

  return (
    <>
      <Navbar />
      <div className={g.container}>
        {loading && <div className="squareSpinner" style={{ margin: 'auto', marginTop: 100 }} />}
        {!loading && !user && <p style={{ color: 'red', textAlign: 'center', marginTop: 100 }}>User not found.</p>}
        {!loading && user && (
          <div className={g.card} style={{ height: 'auto', border: '1px solid var(--border)', marginTop: 40, marginBottom: 40 }}>
            <div className={g.cardTop} style={{ background: 'var(--accent)' }} />
            <div className={g.cardBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-2)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontFamily: 'var(--font-space)', fontWeight: 'bold' }}>
                    {user.name?.[0]}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2rem', margin: 0 }}>{user.name}</h1>
                      {user.verified && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: '0.75rem', fontWeight: 700, color: '#22c55e',
                          border: '1px solid #22c55e', padding: '2px 10px',
                        }}>
                          <IconShieldCheck size={13} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{user.email}</p>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>
                      {user.year ? `Year ${user.year}` : "Year not set"}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className={`${g.btn} ${g.btnPrimary}`} onClick={() => router.push(`/chat?dm=${user._id}`)}>
                    <IconMessage size={18} /> Message
                  </button>
                  <a href={`mailto:${user.email}`} className={g.btn}>
                    <IconMail size={18} /> Email
                  </a>
                  <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>
                    {user.role}
                  </span>
                </div>
              </div>

              {user.bio && (
                <div style={{ marginBottom: 32, fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {user.bio}
                </div>
              )}

              {user.collaborationStatus && user.collaborationStatus.visible && (
                <div style={{ padding: 16, border: '1px solid var(--border)', background: 'var(--bg-2)', marginBottom: 32 }}>
                  <CollaborationStatus
                    level={user.collaborationStatus.level}
                    visible={true}
                    onChange={() => {}}
                    readonly
                  />
                </div>
              )}

              {user.powProjects && user.powProjects.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Proof of Work Portfolios
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {user.powProjects.map((proj, idx) => (
                      <div key={idx} style={{ padding: 16, border: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', fontFamily: 'var(--font-space)', marginBottom: 4 }}>
                            {proj.title}
                          </div>
                          <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'none' }}>
                            {proj.url}
                          </a>
                        </div>
                        <button 
                          className={g.btn} 
                          style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/pow/endorse', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ targetUserId: user._id, projectIndex: idx })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setUser(prev => {
                                  if (!prev) return prev;
                                  const newPow = [...(prev.powProjects || [])];
                                  newPow[idx] = data.project;
                                  return { ...prev, powProjects: newPow };
                                });
                              } else {
                                alert("Must be logged in to endorse!");
                              }
                            } catch (e) { console.error(e); }
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>🔥</span> 
                          <span style={{ fontWeight: 600 }}>Endorse</span>
                          <span style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem', marginLeft: 4 }}>
                            {proj.endorsements.length}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={g.grid} style={{ marginBottom: 32 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Skills</h3>
                  <div className={g.tagList}>
                    {user.skills?.length ? (
                      user.skills.map((skill) => (
                        <span key={skill} className={g.tag} style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No skills added.</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Interests</h3>
                  <div className={g.tagList}>
                    {user.interests?.length ? (
                      user.interests.map((interest) => (
                        <span key={interest} className={g.tag} style={{ background: 'var(--accent-2)', color: '#000', border: 'none' }}>
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No interests added.</span>
                    )}
                  </div>
                </div>
              </div>

              {user.socialLinks && (user.socialLinks.github || user.socialLinks.linkedin || user.socialLinks.portfolio) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {user.socialLinks.github && (
                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className={g.btn}>
                      <IconExternalLink size={16} /> GitHub
                    </a>
                  )}
                  {user.socialLinks.linkedin && (
                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={g.btn}>
                      <IconExternalLink size={16} /> LinkedIn
                    </a>
                  )}
                  {user.socialLinks.portfolio && (
                    <a href={user.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className={g.btn}>
                      <IconExternalLink size={16} /> Portfolio
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
