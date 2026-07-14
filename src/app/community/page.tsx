"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { getAuthHeaders } from "@/lib/api";
import { IconBuildingCommunity, IconUsers, IconCode, IconMessageCircle, IconMapPin, IconSearch, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import g from "@/app/grid.module.css";

interface CommunityUser {
  _id: string;
  name: string;
  branch?: string;
  year?: number;
  skills: string[];
  bio?: string;
  verified?: boolean;
  college?: string;
}

interface CommunityDiscussion {
  _id: string;
  title: string;
  body: string;
  author: { name: string };
  createdAt: string;
  commentCount?: number;
  tags?: string[];
}

interface CommunityProject {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  teamMembers: { name?: string; _id: string }[];
}

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<CommunityUser[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "discussions" | "projects">("members");
  const [search, setSearch] = useState("");

  const college = (profile as any)?.college;
  const city = (profile as any)?.city;

  useEffect(() => {
    if (!college) { setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch college members
        const [membersRes, discussionsRes] = await Promise.all([
          fetch(`/api/users?college=${encodeURIComponent(college)}&limit=50`, { headers: getAuthHeaders() }),
          fetch(`/api/discussions?limit=20`, { headers: getAuthHeaders() }),
        ]);

        if (membersRes.ok) {
          const d = await membersRes.json();
          setMembers(Array.isArray(d.users) ? d.users.filter((u: CommunityUser) => u._id !== (profile as any)?._id?.toString()) : []);
        }

        if (discussionsRes.ok) {
          const d = await discussionsRes.json();
          setDiscussions(Array.isArray(d.discussions) ? d.discussions.slice(0, 10) : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [college, profile]);

  const filteredMembers = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.branch?.toLowerCase().includes(search.toLowerCase()) ||
    m.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (!user) {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: "center", paddingTop: 120 }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Log in to view your college community.</p>
          <Link href="/login" className={`${g.btn} ${g.btnPrimary}`}>Log in</Link>
        </div>
      </>
    );
  }

  if (!college) {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: "center", paddingTop: 120 }}>
          <IconBuildingCommunity size={64} style={{ color: "var(--text-muted)", marginBottom: 24, opacity: 0.3 }} />
          <h2 style={{ fontFamily: "var(--font-space)", marginBottom: 12 }}>No college set yet</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Complete your profile to access your college community.</p>
          <Link href="/profile" className={`${g.btn} ${g.btnPrimary}`}>Complete Profile</Link>
        </div>
      </>
    );
  }

  const TABS = [
    { id: "members" as const, label: "Members", icon: <IconUsers size={16} />, count: members.length },
    { id: "discussions" as const, label: "Discussions", icon: <IconMessageCircle size={16} />, count: discussions.length },
    { id: "projects" as const, label: "Projects", icon: <IconCode size={16} />, count: projects.length },
  ];

  return (
    <>
      <Navbar />
      <div className={g.container} style={{ maxWidth: 1100, paddingTop: 100, paddingBottom: 80 }}>

        {/* College Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <div style={{ width: 72, height: 72, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconBuildingCommunity size={36} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "var(--font-space)", fontSize: "2rem", margin: 0, letterSpacing: "-0.5px" }}>
                {college}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", marginTop: 8 }}>
                <IconMapPin size={16} />
                <span>{city || "India"}</span>
              </div>
              <p style={{ fontFamily: "var(--font-space)", color: "var(--text-muted)", marginTop: 12, fontSize: "0.95rem" }}>
                Your college community on Grid. Connect with batchmates, find collaborators, and see what's happening on campus.
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0, border: "1px solid var(--border)", width: "100%", marginTop: 16 }}>
              {[
                { label: "Members", value: members.length },
                { label: "Verified", value: members.filter(m => m.verified).length },
                { label: "Branches", value: [...new Set(members.map(m => m.branch).filter(Boolean))].length },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: "1 1 100px", padding: "16px 12px", borderLeft: i > 0 ? "1px solid var(--border)" : "none", borderTop: i > 0 ? "none" : "none", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-space)", fontSize: "1.75rem", fontWeight: 800 }}>{stat.value}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: 40, overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
                fontFamily: "var(--font-space)", fontWeight: 600, fontSize: "0.9rem",
                background: "transparent", border: "none", cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid var(--text)" : "2px solid transparent",
                marginBottom: -2, color: activeTab === tab.id ? "var(--text)" : "var(--text-muted)",
                transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0
              }}
            >
              {tab.icon} {tab.label}
              <span style={{ fontSize: "0.75rem", padding: "1px 6px", background: activeTab === tab.id ? "var(--text)" : "var(--bg-2)", color: activeTab === tab.id ? "var(--bg)" : "var(--text-muted)", fontFamily: "var(--font-space)", fontWeight: 700 }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>Loading community...</div>
        ) : (
          <>
            {/* Members Tab */}
            {activeTab === "members" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", padding: "0 16px", marginBottom: 32, background: "var(--bg-2)" }}>
                  <IconSearch size={18} style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    style={{ border: "none", background: "transparent", padding: "14px 0", flex: 1, color: "var(--text)", outline: "none", fontFamily: "var(--font-inter)" }}
                    placeholder="Search by name, branch, or skill..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {filteredMembers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                    <IconUsers size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <div>No other members from {college} yet.</div>
                    <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Share Grid with your batchmates!</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
                    {filteredMembers.map(member => (
                      <Link key={member._id} href={`/users/${member._id}`} style={{ textDecoration: "none" }}>
                        <div
                          className={g.card}
                          style={{ height: "auto", border: "1px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s" }}
                        >
                          <div className={g.cardTop} style={{ background: "var(--accent)", height: 4 }} />
                          <div className={g.cardBody}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                              <div style={{ width: 44, height: 44, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space)", fontWeight: 900, fontSize: "1.1rem", flexShrink: 0 }}>
                                {member.name?.[0]?.toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ fontWeight: 700, fontFamily: "var(--font-space)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
                                  {member.verified && (
                                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#22c55e", border: "1px solid #22c55e", padding: "1px 5px", flexShrink: 0 }}>✓</span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  {member.branch && `${member.branch}`}{member.year && ` · Y${member.year}`}
                                </div>
                              </div>
                            </div>

                            {member.bio && (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {member.bio}
                              </p>
                            )}

                            {member.skills.length > 0 && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {member.skills.slice(0, 4).map(s => (
                                  <span key={s} className={g.tag} style={{ fontSize: "0.75rem" }}>{s}</span>
                                ))}
                                {member.skills.length > 4 && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+{member.skills.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Discussions Tab */}
            {activeTab === "discussions" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>Recent discussions from your college</p>
                  <Link href="/discussions" className={g.btn} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
                    All Discussions <IconArrowRight size={14} />
                  </Link>
                </div>

                {discussions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                    <IconMessageCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <div>No discussions yet. Start one!</div>
                    <Link href="/discussions" className={`${g.btn} ${g.btnPrimary}`} style={{ display: "inline-flex", marginTop: 16 }}>Go to Discussions</Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {discussions.map(d => (
                      <Link key={d._id} href={`/discussions`} style={{ textDecoration: "none" }}>
                        <div style={{ padding: "20px 24px", border: "1px solid var(--border)", background: "var(--bg)", transition: "border-color 0.15s", cursor: "pointer" }}>
                          <div style={{ fontFamily: "var(--font-space)", fontWeight: 600, marginBottom: 6 }}>{d.title}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {d.body}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span>by {d.author?.name || "Anonymous"}</span>
                            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                <IconCode size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <div style={{ fontFamily: "var(--font-space)", marginBottom: 8 }}>College-filtered projects coming soon</div>
                <Link href="/projects" className={`${g.btn} ${g.btnPrimary}`} style={{ display: "inline-flex", marginTop: 12 }}>Browse All Projects</Link>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
