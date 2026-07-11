"use client";

import React from "react";
import { IconGitMerge, IconGitPullRequest, IconStar, IconCode } from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import s from "../pow.module.css";

const REPOS = [
  { name: "grid-core", role: "Maintainer", stars: 128, lang: "TypeScript", langColor: "#3178c6", commits: [10, 25, 15, 30, 20, 45, 35] },
  { name: "bento-ui", role: "Creator", stars: 84, lang: "React", langColor: "#61dafb", commits: [5, 10, 8, 15, 20, 18, 25] },
  { name: "nexus-api", role: "Contributor", stars: 412, lang: "Go", langColor: "#00ADD8", commits: [2, 4, 1, 5, 8, 3, 10] },
  { name: "zk-proofs-poc", role: "Creator", stars: 32, lang: "Rust", langColor: "#dea584", commits: [20, 15, 30, 40, 25, 50, 45] },
];

export default function ProjectsPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {REPOS.map((repo, i) => (
          <div key={i} className={s.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconCode size={20} color="var(--accent)" />
                  {repo.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{repo.role}</div>
              </div>
              <div className={s.badge} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <IconStar size={14} style={{ color: 'var(--accent-2)' }} /> {repo.stars}
              </div>
            </div>

            <div style={{ height: '60px', width: '100%', marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={repo.commits.map(c => ({ val: c }))}>
                  <defs>
                    <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill={`url(#grad-${i})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: repo.langColor }} />
                {repo.lang}
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconGitPullRequest size={14} /> 12</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconGitMerge size={14} /> 8</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
