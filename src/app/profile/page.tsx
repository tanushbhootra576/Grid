"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  IconDeviceFloppy, IconCheck, IconX, IconTrash, IconRefresh,
  IconSearch, IconShieldCheck, IconShieldX, IconUpload,
  IconUser, IconBriefcase, IconCode, IconBuildingCommunity,
  IconBrandGithub, IconBrandLinkedin, IconWorld, IconAlertTriangle, IconGitBranch, IconLink
} from "@tabler/icons-react";
import { CollaborationStatus, CollaborationLevel } from "@/components/CollaborationStatus";
import { signOut } from "next-auth/react";
import { showError, showSuccess } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";
import { INDIAN_COLLEGES, findCollege } from "@/data/colleges";
import g from "../grid.module.css";

interface Project {
  _id: string; title: string; description: string; techStack: string[];
  demoLink?: string; repoLink?: string; isFeatured?: boolean;
  teamMembers: (string | { _id: string; name: string })[];
}

interface Skill {
  _id: string; title: string; type: "OFFER" | "REQUEST";
  status: "OPEN" | "CLOSED"; description: string; tags: string[];
}

interface UserResult { _id: string; name: string; }
interface Contributor { _id: string; name?: string; }

type Tab = "profile" | "verification" | "portfolio" | "contributions";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <IconUser size={16} /> },
  { id: "verification", label: "Verification", icon: <IconShieldCheck size={16} /> },
  { id: "portfolio", label: "Portfolio / PoW", icon: <IconBriefcase size={16} /> },
  { id: "contributions", label: "Contributions", icon: <IconCode size={16} /> },
];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", year: 1, bio: "", college: "", city: "", state: "",
    skills: [] as string[], interests: [] as string[],
    github: "", linkedin: "", portfolio: "",
    collaborationLevel: 1 as CollaborationLevel,
    collaborationVisible: true,
    powProjects: [] as { title: string; url: string; description?: string }[],
  });

  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeDropOpen, setCollegeDropOpen] = useState(false);

  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [powInputTitle, setPowInputTitle] = useState("");
  const [powInputUrl, setPowInputUrl] = useState("");

  // Verification state
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string; reason?: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  // Contributions
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [editProjectModal, setEditProjectModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
  const [editProjectData, setEditProjectData] = useState({ title: "", description: "", techStack: "", demoLink: "", repoLink: "", isFeatured: false });
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorSearch, setContributorSearch] = useState("");
  const [contributorResults, setContributorResults] = useState<UserResult[]>([]);
  const [searchingContrib, setSearchingContrib] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsVerified(!!profile.verified);
      const p = profile as any;
      setFormData({
        name: profile.name || "",
        year: profile.year || 1,
        bio: profile.bio || "",
        college: p.college || "",
        city: p.city || "",
        state: p.state || "",
        skills: profile.skills || [],
        interests: profile.interests || [],
        github: profile.socialLinks?.github || "",
        linkedin: profile.socialLinks?.linkedin || "",
        portfolio: profile.socialLinks?.portfolio || "",
        collaborationLevel: (profile.collaborationStatus?.level ?? 1) as CollaborationLevel,
        collaborationVisible: profile.collaborationStatus?.visible ?? true,
        powProjects: profile.powProjects || [],
      });
      setCollegeSearch(p.college || "");
    } else if (user) {
      setFormData(prev => ({ ...prev, name: user.displayName || "" }));
    }
  }, [profile, user]);

  useEffect(() => {
    if (profile?._id && activeTab === "contributions") {
      const load = async () => {
        setFetchingAssets(true);
        try {
          const pid = profile._id;
          const [pRes, sRes] = await Promise.all([
            fetch(`/api/projects?memberId=${pid}`, { headers: getAuthHeaders() }),
            fetch(`/api/skills?userId=${pid}`, { headers: getAuthHeaders() }),
          ]);
          const pData = await pRes.json();
          const sData = await sRes.json();
          setMyProjects(Array.isArray(pData.projects) ? pData.projects : []);
          setMySkills(Array.isArray(sData.skills) ? sData.skills : []);
        } catch (e) {
          console.error("Failed loading assets", e);
        } finally {
          setFetchingAssets(false);
        }
      };
      load();
    }
  }, [profile?._id, activeTab]);

  useEffect(() => {
    const q = contributorSearch.trim();
    if (q.length < 2) { setContributorResults([]); return; }
    const handle = setTimeout(async () => {
      setSearchingContrib(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=6`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (res.ok && Array.isArray(data.users)) {
          setContributorResults(data.users.filter((u: UserResult) => !contributors.some(c => String(c._id) === String(u._id))));
        }
      } catch { } finally { setSearchingContrib(false); }
    }, 300);
    return () => clearTimeout(handle);
  }, [contributorSearch, contributors]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!profile?.profileLocked && formData.year) {
      if (!window.confirm("Setting Branch and Year will lock your profile permanently. Continue?")) return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT", headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name, email: user.email || undefined,
          year: formData.year, bio: formData.bio,
          college: formData.college, city: formData.city, state: formData.state,
          skills: formData.skills, interests: formData.interests,
          socialLinks: { github: formData.github, linkedin: formData.linkedin, portfolio: formData.portfolio },
          collaborationStatus: { level: formData.collaborationLevel, visible: formData.collaborationVisible },
          powProjects: formData.powProjects,
        }),
      });
      if (res.ok) { await refreshProfile(); showSuccess("Profile updated!"); }
      else { const d = await res.json(); showError({ message: d.error || "Failed" }, "Update Failed"); }
    } catch (e) { showError(e, "Update Failed"); }
    finally { setLoading(false); }
  };

  const handleVerifyId = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { showError({ message: "Image too large (Max 5MB)" }, "Error"); return; }
    setVerifyLoading(true);
    setVerifyResult(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/verify-id", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idImageBase64: base64 }),
        });
        const data = await res.json();
        if (data.success) {
          setVerifyResult({ success: true, message: "Verified! Your student identity has been confirmed.", reason: `Extracted: ${data.data?.extractedName} @ ${data.data?.extractedCollege}` });
          setIsVerified(true);
          refreshProfile();
        } else {
          setVerifyResult({ success: false, message: "Verification failed.", reason: data.data?.reason || "Could not confirm this is a valid student ID matching your profile." });
        }
      } catch { setVerifyResult({ success: false, message: "Server error during verification.", reason: "Please try again." }); }
      finally { setVerifyLoading(false); }
    };
  };

  const handleTagsKeydown = (e: React.KeyboardEvent<HTMLInputElement>, field: "skills" | "interests", input: string, setInput: (v: string) => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = input.trim();
      if (val && !formData[field].includes(val)) {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], val] }));
        setInput("");
      }
    }
  };

  const removeTag = (field: "skills" | "interests", tag: string) =>
    setFormData(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tag) }));

  const handleSkillStatus = async (skillId: string, currentStatus: string) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await fetch(`/api/skills/${skillId}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { setMySkills(prev => prev.map(s => s._id === skillId ? { ...s, status: newStatus as "OPEN" | "CLOSED" } : s)); showSuccess(`Skill marked ${newStatus}`); }
    } catch { showError({ message: "Failed" }, "Error"); }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm("Delete this skill listing?")) return;
    try {
      const res = await fetch(`/api/skills/${skillId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) { setMySkills(prev => prev.filter(s => s._id !== skillId)); showSuccess("Skill deleted"); }
    } catch { showError({ message: "Failed" }, "Error"); }
  };

  const openEditProject = (project: Project) => {
    setEditProjectData({ title: project.title || "", description: project.description || "", techStack: (project.techStack || []).join(", "), demoLink: project.demoLink || "", repoLink: project.repoLink || "", isFeatured: !!project.isFeatured });
    const members: Contributor[] = Array.isArray(project.teamMembers) ? project.teamMembers.map(m => typeof m === "object" ? { _id: String(m._id), name: m.name } : { _id: String(m) }) : [];
    if (profile?._id && !members.some(m => String(m._id) === String(profile._id))) members.push({ _id: String(profile._id), name: profile.name });
    setContributors(members);
    setEditProjectModal({ open: true, project });
  };

  const submitProjectEdit = async () => {
    if (!editProjectModal.project || !profile?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${editProjectModal.project._id}`, {
        method: "PATCH", headers: getAuthHeaders(),
        body: JSON.stringify({ userId: String(profile._id), title: editProjectData.title, description: editProjectData.description, techStack: String(editProjectData.techStack).split(",").map((t: string) => t.trim()).filter(Boolean), demoLink: editProjectData.demoLink, repoLink: editProjectData.repoLink, isFeatured: editProjectData.isFeatured, teamMembers: contributors.map(c => String(c._id)) }),
      });
      const data = await res.json();
      if (res.ok && data.project) { setMyProjects(prev => prev.map(p => p._id === data.project._id ? data.project : p)); showSuccess("Project updated."); setEditProjectModal({ open: false, project: null }); }
      else showError({ message: data.error || "Failed" }, "Error");
    } catch (e) { showError(e, "Error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm("Delete your account permanently? All data will be lost.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok && res.status !== 404) throw new Error("Failed to delete user");
      await signOut({ callbackUrl: "/" });
    } catch (error) { showError({ message: error instanceof Error ? error.message : "Failed to delete account." }, "Error"); setLoading(false); }
  };

  // Profile completion score
  const completionItems = [
    { label: "Name set", done: !!formData.name },
    { label: "College set", done: !!formData.college },
    { label: "Year", done: !!formData.year },
    { label: "Bio written", done: formData.bio.length > 10 },
    { label: "Skills added", done: formData.skills.length > 0 },
    { label: "GitHub linked", done: !!formData.github },
    { label: "ID Verified", done: isVerified },
  ];
  const completionScore = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: "center", paddingTop: 120 }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Please log in to view your profile.</p>
          <a href="/login" className={`${g.btn} ${g.btnPrimary}`}>Log in</a>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={g.container} style={{ maxWidth: 1100, paddingTop: 100, paddingBottom: 80 }}>
        
        {/* Top Identity Strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontFamily: "var(--font-space)", fontWeight: 900, flexShrink: 0 }}>
            {formData.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-space)", fontSize: "1.75rem", margin: 0 }}>{formData.name || user.email}</h1>
              {isVerified ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#22c55e", border: "1px solid #22c55e", padding: "2px 10px" }}>
                  <IconShieldCheck size={13} /> VERIFIED
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", border: "1px solid #ef4444", padding: "2px 10px" }}>
                  <IconShieldX size={13} /> UNVERIFIED
                </span>
              )}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>{user.email} {formData.year && `· Year ${formData.year}`}</div>
          </div>
          {/* Completion Bar */}
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 6 }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Profile Completion</span>
              <span style={{ fontFamily: "var(--font-space)", fontWeight: 700 }}>{completionScore}%</span>
            </div>
            <div style={{ height: 6, background: "var(--border)", width: "100%" }}>
              <div style={{ height: "100%", width: `${completionScore}%`, background: completionScore === 100 ? "#22c55e" : "var(--accent)", transition: "width 0.3s" }} />
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
                transition: "all 0.15s"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 32 }}>
            <div style={{ flex: "1 1 300px", minWidth: 0 }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 20 }}>Basic Info</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 20, marginBottom: 20 }}>
                  <div className={g.formGroup}>
                    <label className={g.label}>Full Name</label>
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className={g.formGroup}>
                    <label className={g.label}>Bio</label>
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="One-liner about yourself" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                  </div>

                  <div className={g.formGroup}>
                    <label className={g.label}>Year {profile?.profileLocked && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(locked)</span>}</label>
                    <input type="number" className={g.input} style={{ border: "1px solid var(--border)" }} min={1} max={5} value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} disabled={!!profile?.profileLocked} />
                  </div>
                </div>

                {/* College autocomplete — full width */}
                <div className={g.formGroup} style={{ position: "relative", marginBottom: 0 }}>
                  <label className={g.label}>College <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>— auto-fills city & state</span></label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", padding: "0 12px", background: "var(--bg)" }}>
                    <IconBuildingCommunity size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <input
                      style={{ border: "none", background: "transparent", flex: 1, padding: "12px", color: "var(--text)", outline: "none", fontFamily: "var(--font-inter)" }}
                      placeholder="Search: IIT Bombay, VIT, BITS Pilani..."
                      value={collegeSearch}
                      onChange={e => { setCollegeSearch(e.target.value); setFormData({ ...formData, college: "" }); setCollegeDropOpen(true); }}
                      onFocus={() => setCollegeDropOpen(true)}
                      onBlur={() => setTimeout(() => setCollegeDropOpen(false), 150)}
                    />
                    {formData.college && <IconCheck size={16} style={{ color: "#22c55e", flexShrink: 0 }} />}
                  </div>
                  {collegeDropOpen && collegeSearch.length > 1 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg)", border: "1px solid var(--border)", zIndex: 50, maxHeight: 260, overflowY: "auto" }}>
                      {INDIAN_COLLEGES.filter(c =>
                        c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                        c.city.toLowerCase().includes(collegeSearch.toLowerCase())
                      ).slice(0, 10).map(c => (
                        <button
                          key={c.name}
                          style={{ display: "flex", flexDirection: "column", width: "100%", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--border)" }}
                          onClick={() => {
                            const college = findCollege(c.name);
                            setFormData({ ...formData, college: c.name, city: college?.city || "", state: college?.state || "" });
                            setCollegeSearch(c.name);
                            setCollegeDropOpen(false);
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{c.city}, {c.state} · {c.type}</div>
                        </button>
                      ))}
                      {INDIAN_COLLEGES.filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase())).length === 0 && (
                        <div style={{ padding: 16, fontSize: "0.85rem", color: "var(--text-muted)" }}>No results. Type your college manually below.</div>
                      )}
                    </div>
                  )}
                  {/* Manual city/state if not in list */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                </div>
              </div>


              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 20 }}>Links</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { icon: <IconBrandGithub size={18} />, label: "GitHub URL", key: "github" as const },
                    { icon: <IconBrandLinkedin size={18} />, label: "LinkedIn URL", key: "linkedin" as const },
                    { icon: <IconWorld size={18} />, label: "Portfolio URL", key: "portfolio" as const },
                  ].map(({ icon, label, key }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", padding: "0 16px", background: "var(--bg)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
                      <input
                        style={{ border: "none", background: "transparent", flex: 1, padding: "12px 0", color: "var(--text)", outline: "none", fontFamily: "var(--font-inter)" }}
                        placeholder={label}
                        value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 20 }}>Skills & Interests</h3>
                <div className={g.formGroup} style={{ marginBottom: 16 }}>
                  <label className={g.label}>Skills <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>— press Enter to add</span></label>
                  <div style={{ border: "1px solid var(--border)", padding: 12, background: "var(--bg-2)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: formData.skills.length > 0 ? 12 : 0 }}>
                      {formData.skills.map(s => (
                        <span key={s} className={g.badge} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {s} <IconX size={12} style={{ cursor: "pointer" }} onClick={() => removeTag("skills", s)} />
                        </span>
                      ))}
                    </div>
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="e.g. React, Node.js, Python" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} onKeyDown={e => handleTagsKeydown(e, "skills", skillsInput, setSkillsInput)} />
                  </div>
                </div>
                <div className={g.formGroup}>
                  <label className={g.label}>Interests <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>— press Enter to add</span></label>
                  <div style={{ border: "1px solid var(--border)", padding: 12, background: "var(--bg-2)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: formData.interests.length > 0 ? 12 : 0 }}>
                      {formData.interests.map(s => (
                        <span key={s} className={g.badge} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {s} <IconX size={12} style={{ cursor: "pointer" }} onClick={() => removeTag("interests", s)} />
                        </span>
                      ))}
                    </div>
                    <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="e.g. Machine Learning, Open Source" value={interestsInput} onChange={e => setInterestsInput(e.target.value)} onKeyDown={e => handleTagsKeydown(e, "interests", interestsInput, setInterestsInput)} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 20 }}>Collaboration Status</h3>
                <div style={{ padding: 20, border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  <CollaborationStatus level={formData.collaborationLevel} visible={formData.collaborationVisible} onChange={(level, visible) => setFormData(p => ({ ...p, collaborationLevel: level, collaborationVisible: visible }))} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button className={g.btn} style={{ color: "red", borderColor: "red", fontSize: "0.85rem" }} onClick={handleDelete}>
                  <IconTrash size={16} /> Delete Account
                </button>
                <button className={`${g.btn} ${g.btnPrimary}`} onClick={handleSubmit} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IconDeviceFloppy size={18} /> {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Sidebar: completion checklist */}
            <div style={{ flex: "1 1 250px", maxWidth: 400 }}>
              <div style={{ border: "1px solid var(--border)", padding: 24, background: "var(--bg-2)", position: "sticky", top: 80 }}>
                <h4 style={{ fontFamily: "var(--font-space)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20, marginTop: 0 }}>Profile Health</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {completionItems.map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.9rem" }}>
                      <div style={{ width: 20, height: 20, border: item.done ? "none" : "2px solid var(--border)", background: item.done ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.done && <IconCheck size={13} color="#fff" />}
                      </div>
                      <span style={{ fontFamily: "var(--font-space)", color: item.done ? "var(--text)" : "var(--text-muted)", textDecoration: item.done ? "none" : "none" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {!isVerified && (
                  <div style={{ fontFamily: "var(--font-space)", marginTop: 24, padding: 12, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <IconAlertTriangle size={14} style={{ color: "#ef4444", verticalAlign: "middle", marginRight: 6 }} />
                    Verify your ID to unlock Chat and PoW endorsements.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: VERIFICATION */}
        {activeTab === "verification" && (
          <div style={{ maxWidth: 620 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.25rem", marginBottom: 8 }}>Student ID Verification</h3>
            <p style={{ fontFamily: "var(--font-space)", color: "var(--text-muted)", marginBottom: 40, lineHeight: 1.6 }}>
              Upload a clear photo of your college ID card. Our AI will read it and cross-check your name against your profile.
              Verification unlocks <strong>Universal Chat</strong> and <strong>PoW Endorsements</strong>.
            </p>

            {isVerified ? (
              <div style={{ padding: 32, border: "2px solid #22c55e", background: "rgba(34,197,94,0.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <IconShieldCheck size={48} color="#22c55e" />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-space)", fontSize: "1.25rem", fontWeight: 700, color: "#22c55e" }}>Verified</div>
                  <div style={{ fontFamily: "var(--font-space)", color: "var(--text-muted)", marginTop: 4 }}>Your student identity has been confirmed.</div>
                </div>
              </div>
            ) : (
              <div>
                {verifyResult ? (
                  <div style={{ padding: 24, border: `2px solid ${verifyResult.success ? "#22c55e" : "#ef4444"}`, background: verifyResult.success ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      {verifyResult.success ? <IconShieldCheck size={24} color="#22c55e" /> : <IconShieldX size={24} color="#ef4444" />}
                      <strong style={{ color: verifyResult.success ? "#22c55e" : "#ef4444" }}>{verifyResult.message}</strong>
                    </div>
                    {verifyResult.reason && <p style={{ fontFamily: "var(--font-space)", color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>{verifyResult.reason}</p>}
                    {!verifyResult.success && (
                      <button className={g.btn} style={{ marginTop: 16, fontSize: "0.85rem" }} onClick={() => { setVerifyResult(null); idFileInputRef.current?.click(); }}>
                        Try Again
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{ border: "2px dashed var(--border)", padding: "60px 40px", textAlign: "center", cursor: verifyLoading ? "not-allowed" : "pointer", background: "var(--bg-2)", transition: "border-color 0.2s" }}
                    onClick={() => !verifyLoading && idFileInputRef.current?.click()}
                  >
                    <input type="file" accept="image/jpeg,image/png,image/webp" ref={idFileInputRef} style={{ display: "none" }} onChange={handleVerifyId} />
                    {verifyLoading ? (
                      <>
                        <IconShieldCheck size={48} style={{ color: "var(--text-muted)", marginBottom: 16, opacity: 0.4 }} />
                        <div style={{ fontFamily: "var(--font-space)", fontWeight: 600 }}>AI is scanning your ID...</div>
                        <div style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>This usually takes 5–10 seconds</div>
                      </>
                    ) : (
                      <>
                        <IconUpload size={48} style={{ color: "var(--text-muted)", marginBottom: 16, opacity: 0.4 }} />
                        <div style={{ fontFamily: "var(--font-space)", fontWeight: 600, fontSize: "1.1rem" }}>Upload ID Card Photo</div>
                        <div style={{ fontFamily: "var(--font-space)", color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>JPG, PNG or WebP · Max 5MB</div>
                        <div style={{ marginTop: 24 }}>
                          <span className={g.btn} style={{ pointerEvents: "none" }}>Browse Files</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 24, padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-space)" }}>
                  <strong style={{ color: "var(--text)" }}>Tips for successful verification:</strong>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Ensure the name on the card matches your profile name exactly</li>
                    <li>Image should be well-lit and clearly readable</li>
                    <li>Avoid glare, shadows, or cropped-out text</li>
                    <li>Your name on Grid: <strong>{formData.name}</strong></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.25rem", margin: 0 }}>Proof of Work</h3>
                <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Your verified project portfolio. Alumni can endorse these to boost your credibility on the platform.</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {formData.powProjects.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
                  <IconGitBranch size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <div>No projects added yet. Add your best work below.</div>
                </div>
              )}
              {formData.powProjects.map((p, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: "var(--font-space)" }}>{p.title}</div>
                    <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <IconLink size={13} /> {p.url}
                    </a>
                  </div>
                  <button className={g.btn} style={{ padding: "6px 10px", color: "red", borderColor: "red" }} onClick={() => setFormData(f => ({ ...f, powProjects: f.powProjects.filter((_, i) => i !== idx) }))}>
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid var(--border)", padding: 24, background: "var(--bg-2)" }}>
              <h4 style={{ fontFamily: "var(--font-space)", marginTop: 0, marginBottom: 20 }}>Add a Project</h4>
              <button className={`${g.btn} ${g.btnPrimary}`} style={{marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8}} onClick={async () => { setLoading(true); try { const res = await fetch('/api/users/sync-github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: formData.github ? formData.github.split('github.com/')[1] : '' }) }); const data = await res.json(); if (res.ok) { setFormData(f => ({ ...f, powProjects: data.powProjects })); alert(`Successfully synced ${data.addedCount} projects!`); } else alert(data.error || 'Sync failed'); } catch (e) { alert('Error syncing'); } setLoading(false); }}> <IconBrandGithub size={18} /> Auto-Sync GitHub Repos </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
                <div className={g.formGroup} style={{ margin: 0, flex: "1 1 200px" }}>
                  <label className={g.label}>Project Name</label>
                  <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="e.g. Grid" value={powInputTitle} onChange={e => setPowInputTitle(e.target.value)} />
                </div>
                <div className={g.formGroup} style={{ margin: 0, flex: "2 1 250px" }}>
                  <label className={g.label}>GitHub or Demo URL</label>
                  <input className={g.input} style={{ border: "1px solid var(--border)" }} placeholder="https://github.com/..." value={powInputUrl} onChange={e => setPowInputUrl(e.target.value)} />
                </div>
                <button
                  className={`${g.btn} ${g.btnPrimary}`}
                  style={{ height: 44 }}
                  onClick={e => {
                    e.preventDefault();
                    if (powInputTitle.trim() && powInputUrl.trim()) {
                      setFormData(f => ({ ...f, powProjects: [...f.powProjects, { title: powInputTitle.trim(), url: powInputUrl.trim() }] }));
                      setPowInputTitle(""); setPowInputUrl("");
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
              <button className={`${g.btn} ${g.btnPrimary}`} onClick={handleSubmit} disabled={loading}>
                <IconDeviceFloppy size={18} /> {loading ? "Saving..." : "Save Portfolio"}
              </button>
            </div>
          </div>
        )}

        {/* TAB: CONTRIBUTIONS */}
        {activeTab === "contributions" && (
          <div>
            {fetchingAssets ? (
              <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>Loading contributions...</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
                  <span className={g.badge} style={{ background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" }}>Projects: {myProjects.length}</span>
                  <span className={g.badge} style={{ background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" }}>Skills Listed: {mySkills.length}</span>
                </div>

                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.1rem", marginBottom: 16, borderBottom: "2px solid var(--border)", paddingBottom: 12 }}>Projects</h3>
                <div className={g.grid} style={{ marginBottom: 40 }}>
                  {myProjects.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No projects yet.</p> : myProjects.map(p => (
                    <div key={p._id} className={g.card} style={{ height: "auto", border: "1px solid var(--border)" }}>
                      <div className={g.cardBody}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ fontFamily: "var(--font-space)", margin: 0 }}>{p.title}</h4>
                          <button className={g.btn} style={{ padding: "4px 12px", fontSize: "0.8rem" }} onClick={() => openEditProject(p)}>Edit</button>
                        </div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>{p.description}</p>
                        <div className={g.tagList}>{(p.techStack || []).slice(0, 6).map(t => <span key={t} className={g.tag}>{t}</span>)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.1rem", marginBottom: 16, borderBottom: "2px solid var(--border)", paddingBottom: 12 }}>My Skills</h3>
                <div className={g.grid}>
                  {mySkills.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No skills posted.</p> : mySkills.map(s => (
                    <div key={s._id} className={g.card} style={{ height: "auto", border: "1px solid var(--border)", opacity: s.status === "CLOSED" ? 0.6 : 1 }}>
                      <div className={g.cardBody}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ fontFamily: "var(--font-space)", margin: 0, textDecoration: s.status === "CLOSED" ? "line-through" : "none" }}>{s.title}</h4>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span className={g.badge} style={{ background: s.type === "OFFER" ? "var(--accent)" : "var(--accent-2)", color: s.type === "OFFER" ? "#fff" : "#000" }}>{s.type}</span>
                          </div>
                        </div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>{s.description}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div className={g.tagList}>{(s.tags || []).slice(0, 3).map(t => <span key={t} className={g.tag}>{t}</span>)}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className={g.btn} style={{ padding: "6px" }} onClick={() => handleSkillStatus(s._id, s.status)} title={s.status === "OPEN" ? "Mark Done" : "Re-open"}>
                              {s.status === "OPEN" ? <IconCheck size={16} /> : <IconRefresh size={16} />}
                            </button>
                            <button className={g.btn} style={{ padding: "6px", color: "red", borderColor: "red" }} onClick={() => handleDeleteSkill(s._id)}>
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editProjectModal.open && (
        <div className={g.modalBackdrop}>
          <div className={g.modal} style={{ maxWidth: 600 }}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>Edit Project</h2>
              <button className={g.closeBtn} onClick={() => setEditProjectModal({ open: false, project: null })}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody}>
              {[
                { label: "Title", key: "title" as const, type: "text" },
                { label: "Tech Stack (comma separated)", key: "techStack" as const, type: "text" },
                { label: "Demo Link", key: "demoLink" as const, type: "text" },
                { label: "Repo Link", key: "repoLink" as const, type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} className={g.formGroup}>
                  <label className={g.label}>{label}</label>
                  <input type={type} className={g.input} style={{ border: "1px solid var(--border)" }} value={editProjectData[key] as string} onChange={e => setEditProjectData(d => ({ ...d, [key]: e.target.value }))} />
                </div>
              ))}
              <div className={g.formGroup}>
                <label className={g.label}>Description</label>
                <textarea className={`${g.input} ${g.textarea}`} style={{ border: "1px solid var(--border)", minHeight: 80 }} value={editProjectData.description} onChange={e => setEditProjectData(d => ({ ...d, description: e.target.value }))} />
              </div>
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <label className={g.label} style={{ display: "block", marginBottom: 12 }}>Contributors</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {contributors.map(c => {
                    const id = String(c._id);
                    return (
                      <span key={id} className={g.badge} style={{ background: id === String(profile?._id) ? "var(--accent)" : "var(--bg-2)", color: id === String(profile?._id) ? "#fff" : "var(--text)", display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--border)" }}>
                        {c.name || "You"} {id !== String(profile?._id) && <IconX size={12} style={{ cursor: "pointer" }} onClick={() => setContributors(prev => prev.filter(c2 => String(c2._id) !== id))} />}
                      </span>
                    );
                  })}
                </div>
                <div style={{ border: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 12px" }}>
                  <IconSearch size={16} style={{ color: "var(--text-muted)" }} />
                  <input type="text" style={{ border: "none", background: "transparent", padding: "12px", flex: 1, color: "var(--text)", outline: "none" }} placeholder="Search users to add" value={contributorSearch} onChange={e => setContributorSearch(e.target.value)} />
                </div>
                {searchingContrib && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>Searching...</div>}
                {contributorResults.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {contributorResults.map(u => (
                      <span key={u._id} className={g.badge} style={{ cursor: "pointer", border: "1px solid var(--border)" }} onClick={() => { setContributors(prev => [...prev, u]); setContributorSearch(""); setContributorResults([]); }}>
                        + {u.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                <button className={g.btn} onClick={() => setEditProjectModal({ open: false, project: null })}>Cancel</button>
                <button className={`${g.btn} ${g.btnPrimary}`} onClick={submitProjectEdit} disabled={loading}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
