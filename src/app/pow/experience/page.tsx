"use client";

import React, { useState } from "react";
import { IconBriefcase, IconCalendar, IconBuilding, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import s from "../pow.module.css";
import g from "../../grid.module.css";

export default function ExperiencePage() {
  const { user, profile, refreshProfile } = useAuth();
  const experience = profile?.powExperience || [];

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ role: "", company: "", duration: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!user || !formData.role || !formData.company) return;
    setLoading(true);
    try {
      const newExp = [...experience, formData];
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powExperience: newExp }),
      });
      if (res.ok) {
        await refreshProfile();
        setIsAdding(false);
        setFormData({ role: "", company: "", duration: "", description: "" });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (idx: number) => {
    if (!user || !confirm("Delete this experience?")) return;
    try {
      const newExp = experience.filter((_, i: number) => i !== idx);
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powExperience: newExp }),
      });
      if (res.ok) await refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Work Experience</h2>
        <button onClick={() => setIsAdding(!isAdding)} style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
          {isAdding ? "Cancel" : <><IconPlus size={16} /> Add Experience</>}
        </button>
      </div>

      {isAdding && (
        <div className={s.card} style={{ padding: "24px", marginBottom: "24px", border: "1px dashed var(--accent)" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Add Work Experience</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Role/Title</label>
              <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Software Engineering Intern" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Company</label>
              <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="e.g. Google" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Duration</label>
              <input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. May 2023 - Aug 2023" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Description (optional)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What did you build? What technologies did you use?" rows={3} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)", fontFamily: "inherit" }} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={loading} style={{ background: "var(--text)", color: "var(--bg)", padding: "8px 16px", borderRadius: "4px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {loading ? "Saving..." : "Save Experience"}
          </button>
        </div>
      )}

      {experience.length === 0 && !isAdding ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>You haven't added any work experience yet.</p>
          <button onClick={() => setIsAdding(true)} style={{ color: "var(--accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Add your first experience</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {experience.map((job: any, i: number) => (
            <div key={i} className={s.card} style={{ padding: '24px', position: "relative" }}>
              <button onClick={() => handleDelete(i)} style={{ position: "absolute", top: 16, right: 16, background: "transparent", color: "red", border: "none", cursor: "pointer", opacity: 0.5 }}>
                <IconTrash size={16} />
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconBriefcase size={20} color="var(--accent)" />
                    {job.role}
                  </h3>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconBuilding size={16} color="var(--text-muted)" /> {job.company}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <IconCalendar size={16} /> {job.duration}
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px' }}>
                {job.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
