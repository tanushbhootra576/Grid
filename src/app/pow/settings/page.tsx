"use client";

import { IconSettings, IconBrandGithub, IconBrandFigma, IconLink } from "@tabler/icons-react";
import g from "../../grid.module.css";

export default function SettingsPage() {
  return (
    <div className={g.container} style={{ maxWidth: 1400, marginTop: 40, paddingBottom: 100 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border)', paddingBottom: 24, marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2.5rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Data Sources</h1>
          <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Configure external integrations and privacy settings</div>
        </div>
        <button className={g.btn}>
          <IconSettings size={20} /> Advanced Config
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        
        {/* DATA SOURCES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBrandGithub size={24} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>GitHub</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Connected as @tanush</div>
              </div>
            </div>
            <button className={g.btn} style={{ color: 'var(--text-muted)' }}>Disconnect</button>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBrandFigma size={24} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 4, color: 'var(--text-muted)' }}>Figma</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not Connected</div>
              </div>
            </div>
            <button className={g.btn}>Connect</button>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLink size={24} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 4, color: 'var(--text-muted)' }}>LeetCode</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not Connected</div>
              </div>
            </div>
            <button className={g.btn}>Connect</button>
          </div>

        </div>

        {/* PRIVACY SETTINGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: 32 }}>
            <div style={{ fontFamily: 'var(--font-space)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Privacy Protocol</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              Your Cryptographic Ledger is completely controlled by you. You can choose to expose raw commit data, or only expose the Zero-Knowledge proof of your skills.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="radio" name="privacy" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem' }}>Zero-Knowledge Mode (Recommended)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="radio" name="privacy" style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem' }}>Public Ledger (Show all commits)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: 0.5 }}>
                <input type="radio" name="privacy" disabled style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem' }}>Strictly Private (Off-chain)</span>
              </label>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
