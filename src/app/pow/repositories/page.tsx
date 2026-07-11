"use client";

import { IconBrandGithub, IconCode, IconGitCommit, IconChartBar } from "@tabler/icons-react";
import g from "../../grid.module.css";

const REPOS = [
  { name: "grid-core", lang: "TypeScript", complexity: "O(log n)", lines: "45.2k", stars: 120, status: "INDEXED", hash: "0x8F72A" },
  { name: "frontend-v2", lang: "React", complexity: "O(n)", lines: "12.4k", stars: 45, status: "INDEXED", hash: "0x3A4B9" },
  { name: "api-gateway", lang: "Rust", complexity: "O(1)", lines: "8.9k", stars: 210, status: "INDEXED", hash: "0x1E2F8" },
  { name: "open-source/react", lang: "JavaScript", complexity: "--", lines: "--", stars: 0, status: "PARTIAL", hash: "0x9C8D7" },
  { name: "rust-analyzer", lang: "Rust", complexity: "O(n log n)", lines: "1.2M", stars: 0, status: "ANALYZING", hash: "0x4A1B2" },
];

export default function RepositoriesPage() {
  return (
    <div className={g.container} style={{ maxWidth: 1400, marginTop: 40, paddingBottom: 100 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border)', paddingBottom: 24, marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2.5rem', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Repository Analysis</h1>
          <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>AST Extraction & Complexity Profiling</div>
        </div>
        <button className={g.btn} style={{ background: 'var(--text)', color: 'var(--bg)' }}>
          <IconBrandGithub size={20} /> Force Sync
        </button>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-space)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>Repository</div>
          <div>Language</div>
          <div>Complexity</div>
          <div>Scale (LOC)</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Latest Block</div>
        </div>

        <div>
          {REPOS.map((repo, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '20px 24px', borderBottom: '1px solid var(--border)', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconBrandGithub size={20} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{repo.name}</span>
              </div>
              
              <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.85rem' }}>{repo.lang}</div>
              
              <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.85rem', color: repo.complexity.includes('log') ? 'var(--accent)' : 'var(--text)' }}>
                {repo.complexity}
              </div>
              
              <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.85rem' }}>{repo.lines}</div>
              
              <div>
                <span style={{ 
                  fontFamily: 'var(--font-space)', fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--border)',
                  color: repo.status === 'INDEXED' ? 'var(--accent)' : (repo.status === 'ANALYZING' ? 'var(--text)' : 'var(--text-muted)'),
                  background: repo.status === 'INDEXED' ? 'rgba(0, 255, 128, 0.05)' : 'transparent'
                }}>
                  {repo.status}
                </span>
              </div>
              
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-space)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {repo.hash}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
