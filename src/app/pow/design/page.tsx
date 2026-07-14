"use client";

import React, { useState } from "react";
import { IconBrandFigma, IconLink, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import s from "../pow.module.css";
import g from "../../grid.module.css"; // Assuming grid CSS is accessible

export default function DesignPage() {
  const { user, profile, refreshProfile } = useAuth();
  const designs = profile?.powDesigns || [];

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: "", type: "Figma", url: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!user || !formData.title || !formData.url) return;
    setLoading(true);
    try {
      const newDesigns = [...designs, formData];
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powDesigns: newDesigns }),
      });
      if (res.ok) {
        await refreshProfile();
        setIsAdding(false);
        setFormData({ title: "", type: "Figma", url: "" });
      } else {
        alert("Failed to save design.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (idx: number) => {
    if (!user || !confirm("Delete this design?")) return;
    try {
      const newDesigns = designs.filter((_, i: number) => i !== idx);
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powDesigns: newDesigns }),
      });
      if (res.ok) await refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Design Portfolio</h2>
        <button onClick={() => setIsAdding(!isAdding)} style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
          {isAdding ? "Cancel" : <><IconPlus size={16} /> Add Design</>}
        </button>
      </div>

      {isAdding && (
        <div className={s.card} style={{ padding: "24px", marginBottom: "24px", border: "1px dashed var(--accent)" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Add New Design Asset</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Title</label>
              <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Mobile App UI" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Type</label>
              <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="e.g. Figma, Prototype" style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "8px", color: "var(--text-muted)" }}>Link URL</label>
              <input value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://figma.com/..." style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={loading} style={{ background: "var(--text)", color: "var(--bg)", padding: "8px 16px", borderRadius: "4px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {loading ? "Saving..." : "Save Design"}
          </button>
        </div>
      )}

      {designs.length === 0 && !isAdding ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>You haven't added any design assets to your portfolio yet.</p>
          <button onClick={() => setIsAdding(true)} style={{ color: "var(--accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Add your first design</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          {designs.map((file: any, i: number) => (
            <div key={i} className={s.card} style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '180px', width: '100%', background: `linear-gradient(135deg, var(--bg-2), var(--bg-3))`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <IconBrandFigma size={48} color="var(--border)" />
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {file.type || "Figma File"}
                </div>
                <button onClick={() => handleDelete(i)} style={{ position: 'absolute', top: 16, left: 16, background: 'red', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                  <IconTrash size={16} />
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>{file.title}</h3>
                <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.85rem' }}>
                  <IconLink size={16} /> Open Design File
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
