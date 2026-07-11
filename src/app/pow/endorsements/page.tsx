"use client";

import { IconAward, IconUserPlus, IconChecks } from "@tabler/icons-react";
import g from "../../grid.module.css";

const ENDORSEMENTS = [
  { name: "Sarah Jenkins", role: "Senior Engineer @ Google", text: "Tanush is an incredible frontend developer. We worked together on an open-source React component library and his attention to structural design and CSS grids was unmatched.", status: "Verified Co-Contributor", date: "March 2024" },
  { name: "Rahul Sharma", role: "Tech Lead @ Startup Inc", text: "Built the entire API gateway for our hackathon project in one weekend. Solid understanding of Rust and system design.", status: "Verified Hackathon Teammate", date: "February 2024" },
  { name: "Dr. Alan Turing", role: "Professor, CompSci", text: "Consistently delivered high-quality algorithms for the Advanced Data Structures coursework.", status: "Verified Professor", date: "January 2024" },
];

export default function EndorsementsPage() {
  return (
    <div className={g.container} style={{ maxWidth: 1400, marginTop: 40, paddingBottom: 100 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border)', paddingBottom: 24, marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2.5rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Professional Endorsements</h1>
          <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Verified recommendations from peers, managers, and mentors</div>
        </div>
        <button className={g.btn} style={{ background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' }}>
          <IconUserPlus size={20} /> Request Endorsement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        
        {/* STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: 32 }}>
            <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Reputation Score</div>
            <div style={{ fontFamily: 'var(--font-space)', fontSize: '4rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>94/100</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 16 }}>Based on verified GitHub collaboration history and peer feedback.</div>
          </div>
          
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: 32 }}>
             <IconAward size={48} style={{ color: 'var(--text-muted)', marginBottom: 24 }} />
             <div style={{ fontFamily: 'var(--font-space)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>No Fake Reviews</div>
             <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Unlike traditional platforms, Grid verifies endorsements by cross-referencing GitHub commit history. If someone endorses your code, we check if you actually built it together.</div>
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconChecks size={20} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, textTransform: 'uppercase' }}>Verified Feedback</span>
          </div>
          
          <div>
            {ENDORSEMENTS.map((end, i) => (
              <div key={i} style={{ padding: '32px', borderBottom: '1px solid var(--border)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-space)', fontSize: '1.1rem', fontWeight: 600 }}>{end.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{end.role}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontFamily: 'var(--font-space)', fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--border)', display: 'inline-block', marginBottom: 8,
                      color: 'var(--accent)', background: 'rgba(0, 255, 128, 0.05)'
                    }}>
                      {end.status}
                    </div>
                    <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{end.date}</div>
                  </div>
                </div>

                <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text)', fontStyle: 'italic', paddingLeft: 64 }}>
                  "{end.text}"
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
