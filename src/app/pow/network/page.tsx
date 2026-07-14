"use client";

import React, { useState } from "react";
import { IconCheck, IconMessageCircle, IconUsers, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import s from "../pow.module.css";
import g from "../../grid.module.css";

export default function NetworkPage() {
  const { user, profile, refreshProfile } = useAuth();
  const endorsements = profile?.powEndorsements || [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ authorName: "", role: "", text: "", skills: "" });
  const [loading, setLoading] = useState(false);

  const projectEndorsementsCount = (profile?.powProjects || []).reduce((acc: number, curr: any) => acc + (curr.endorsements?.length || 0), 0);
  const totalEndorsements = projectEndorsementsCount + endorsements.length;

  const handleAdd = async () => {
    if (!user || !formData.authorName || !formData.text) return;
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(Boolean);
      const newEnd = { authorName: formData.authorName, role: formData.role, text: formData.text, skills: skillsArray };
      const newEndorsements = [...endorsements, newEnd];
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powEndorsements: newEndorsements }),
      });
      if (res.ok) {
        await refreshProfile();
        setIsAdding(false);
        setFormData({ authorName: "", role: "", text: "", skills: "" });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (idx: number) => {
    if (!user || !confirm("Delete this endorsement?")) return;
    try {
      const newEndorsements = endorsements.filter((_, i: number) => i !== idx);
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powEndorsements: newEndorsements }),
      });
      if (res.ok) await refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Peer Endorsements</h2>
        <button onClick={() => setIsAdding(!isAdding)} style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
          {isAdding ? "Cancel" : <><IconPlus size={16} /> Add Endorsement</>}
        </button>
      </div>

      {isAdding && (
        <div className={s.card} style={{ padding: "24px", marginBottom: "24px", border: "1px dashed var(--accent)" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Add a written endorsement</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Author Name</label>
              <input value={formData.authorName} onChange={e => setFormData({...formData, authorName: e.target.value})} placeholder="e.g. Priya Sharma" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Author Role/Company</label>
              <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Lead Engineer @ Grid" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Testimonial Text</label>
              <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="Write the endorsement here..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)", fontFamily: "inherit" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Skills Highlighted (comma-separated)</label>
              <input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. React, Performance, UI" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={loading} style={{ background: "var(--text)", color: "var(--bg)", padding: "8px 16px", borderRadius: "4px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {loading ? "Saving..." : "Save Endorsement"}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          {endorsements.length === 0 && !isAdding ? (
            <div style={{ gridColumn: '1 / -1', padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>You haven't received any text endorsements yet.</p>
              <button onClick={() => setIsAdding(true)} style={{ color: "var(--accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Add your first endorsement</button>
            </div>
          ) : (
            endorsements.map((end: any, i: number) => (
              <div key={i} className={s.card} style={{ padding: '24px', position: "relative" }}>
                <button onClick={() => handleDelete(i)} style={{ position: "absolute", top: 16, right: 16, background: "transparent", color: "red", border: "none", cursor: "pointer", opacity: 0.5 }}>
                  <IconTrash size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {end.authorName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{end.authorName}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{end.role}</div>
                  </div>
                </div>
                
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)', marginBottom: '20px', flex: 1 }}>
                  "{end.text}"
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {end.skills?.map((skill: string) => (
                    <span key={skill} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconCheck size={12} color="var(--accent)" /> {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Global Network Stats */}
          <div className={s.cardCol3} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', marginTop: '16px', gridColumn: '1 / -1' }}>
            <div className={s.card} style={{ padding: '32px' }}>
              <div className={s.cardTitle}><IconUsers size={16} /> Verified Connections</div>
              <div className={s.bigStat} style={{ marginTop: 'auto' }}>{profile?.socialLinks ? 1 : 0}</div>
              <div className={s.statSub}>Your active campus network</div>
            </div>
            <div className={s.card} style={{ padding: '32px' }}>
              <div className={s.cardTitle}><IconMessageCircle size={16} /> Total Endorsements Received</div>
              <div className={s.bigStat} style={{ marginTop: 'auto' }}>{totalEndorsements}</div>
              <div className={s.statSub}>Across projects and personal reviews</div>
            </div>
          </div>
      </div>
    </div>
  );
}
