"use client";

import React from "react";
import { IconCheck, IconMessageCircle, IconUsers } from "@tabler/icons-react";
import s from "../pow.module.css";

const ENDORSEMENTS = [
  { name: "Priya Sharma", role: "Frontend Lead @ Grid", text: "Tanush single-handedly optimized our entire React render cycle. Incredible engineer.", skills: ["React", "Performance"] },
  { name: "Alex Chen", role: "Fullstack Dev", text: "Always writes clean, maintainable code. A pleasure to review their PRs.", skills: ["Code Quality", "TypeScript"] },
  { name: "Rahul K.", role: "Design Systems", text: "Bridged the gap between design and engineering perfectly on the Bento UI project.", skills: ["UI/UX", "Figma"] },
];

export default function NetworkPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {ENDORSEMENTS.map((end, i) => (
          <div key={i} className={s.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                {end.name[0]}
              </div>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{end.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{end.role}</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)', marginBottom: '20px', flex: 1 }}>
              "{end.text}"
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {end.skills.map(skill => (
                <span key={skill} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconCheck size={12} color="var(--accent)" /> {skill}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Global Network Stats */}
        <div className={s.cardCol3} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '16px' }}>
          <div className={s.card} style={{ padding: '32px' }}>
            <div className={s.cardTitle}><IconUsers size={16} /> Co-Contributors</div>
            <div className={s.bigStat} style={{ marginTop: 'auto' }}>18</div>
            <div className={s.statSub}>Across 5 different organizations</div>
          </div>
          <div className={s.card} style={{ padding: '32px' }}>
            <div className={s.cardTitle}><IconMessageCircle size={16} /> Endorsements Received</div>
            <div className={s.bigStat} style={{ marginTop: 'auto' }}>42</div>
            <div className={s.statSub}>Signed cryptographically by peers</div>
          </div>
        </div>

    </div>
  );
}
