"use client";

import React from "react";
import { IconGitCommit, IconBrandGithub, IconActivity, IconCode } from "@tabler/icons-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";
import s from "./pow.module.css";

const ACTIVITY_DATA = [
  { name: "Mon", commits: 12 }, { name: "Tue", commits: 24 },
  { name: "Wed", commits: 18 }, { name: "Thu", commits: 36 },
  { name: "Fri", commits: 42 }, { name: "Sat", commits: 8 },
  { name: "Sun", commits: 14 }
];

const SKILL_DATA = [
  { subject: "React", A: 120, fullMark: 150 },
  { subject: "TypeScript", A: 98, fullMark: 150 },
  { subject: "Node.js", A: 86, fullMark: 150 },
  { subject: "UI/UX", A: 99, fullMark: 150 },
  { subject: "Python", A: 65, fullMark: 150 },
  { subject: "SQL", A: 85, fullMark: 150 },
];

const COMMITS = [
  { id: "8f72aB39", repo: "grid-core", msg: "refactor: optimize rendering cycle", time: "2h ago" },
  { id: "3a4b92Cc", repo: "frontend-v2", msg: "feat: implement bento grid layout", time: "5h ago" },
  { id: "1e2f88Bc", repo: "api-gateway", msg: "fix: resolve rate limiting issue", time: "1d ago" },
  { id: "9c8d77Ae", repo: "open-source/react", msg: "docs: update hook references", time: "2d ago" },
];

export default function PoWDashboard() {
  return (
    <div className={s.bentoGrid}>
        
        {/* STATS */}
        <div className={s.card}>
          <div className={s.cardTitle}><IconGitCommit size={16} /> Total Commits</div>
          <div style={{ marginTop: 'auto' }}>
            <div className={s.bigStat}>14,203</div>
            <div className={s.statSub} style={{ color: 'var(--accent)' }}>↑ 12% from last month</div>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}><IconBrandGithub size={16} /> Repositories</div>
          <div style={{ marginTop: 'auto' }}>
            <div className={s.bigStat}>47</div>
            <div className={s.statSub}>Across 3 organizations</div>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardTitle}><IconActivity size={16} /> Global Rank</div>
          <div style={{ marginTop: 'auto' }}>
            <div className={s.bigStat}>Top 4%</div>
            <div className={s.statSub}>Based on verified campus activity</div>
          </div>
        </div>

        {/* ACTIVITY CHART */}
        <div className={`${s.card} ${s.cardCol2}`} style={{ minHeight: 300 }}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>Contribution Velocity (7 Days)</div>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '12px' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Area type="monotone" dataKey="commits" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorCommits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKILL RADAR */}
        <div className={s.card} style={{ minHeight: 300 }}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>Skill Distribution</div>
          </div>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SKILL_DATA}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }} />
                <Radar name="Skills" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT COMMITS */}
        <div className={`${s.card} ${s.cardCol3}`}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>Recent Verified Activity</div>
          </div>
          <div>
            {COMMITS.map((commit, i) => (
              <div key={i} className={s.listRow}>
                <div className={s.listCol}>
                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconCode size={16} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div className={s.listText}>{commit.msg}</div>
                    <div className={s.listSub} style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <span style={{ color: 'var(--accent)' }}>{commit.repo}</span>
                      <span>{commit.time}</span>
                    </div>
                  </div>
                </div>
                <div className={s.listSub} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  {commit.id}
                </div>
              </div>
            ))}
          </div>
        </div>

    </div>
  );
}
