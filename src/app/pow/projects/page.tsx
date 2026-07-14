"use client";

import React from "react";
import { IconLink, IconCode } from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import s from "../pow.module.css";

export default function ProjectsPage() {
  const { profile } = useAuth();
  const projects = profile?.powProjects || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>My Projects</h2>
        <Link href="/profile" style={{ background: "var(--accent)", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "0.9rem", fontWeight: 600 }}>
          Manage Projects
        </Link>
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>You haven't added any projects to your portfolio yet.</p>
          <Link href="/profile" style={{ color: "var(--accent)", fontWeight: 600 }}>Go to Profile to Add Projects</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          {projects.map((repo: any, i: number) => (
            <div key={i} className={s.card} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconCode size={20} color="var(--accent)" />
                    {repo.title}
                  </h3>
                  {repo.description && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {repo.description}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <a href={repo.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                  <IconLink size={16} /> View Project
                </a>
                <div style={{ color: "var(--text-muted)" }}>
                  {repo.endorsements?.length || 0} Endorsement(s)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
