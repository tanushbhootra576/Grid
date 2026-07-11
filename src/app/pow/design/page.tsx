"use client";

import React from "react";
import { IconBrandFigma, IconEye, IconHeart } from "@tabler/icons-react";
import s from "../pow.module.css";

const DESIGN_FILES = [
  { name: "Grid Design System", type: "Library", views: "1.2k", likes: 342, bg: "linear-gradient(135deg, var(--bg-2), var(--bg-3))" },
  { name: "Web3 Wallet Dashboard", type: "Prototype", views: "850", likes: 124, bg: "linear-gradient(135deg, var(--bg-3), var(--bg-2))" },
  { name: "Mobile Hackathon App", type: "File", views: "3.4k", likes: 512, bg: "linear-gradient(135deg, var(--bg-2), var(--bg))" },
  { name: "Dark Mode Components", type: "Library", views: "2.1k", likes: 289, bg: "linear-gradient(135deg, var(--bg-3), var(--bg))" },
];

export default function DesignPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {DESIGN_FILES.map((file, i) => (
          <div key={i} className={s.card} style={{ padding: '0', overflow: 'hidden' }}>
            {/* Mock Figma Preview Area */}
            <div style={{ height: '180px', width: '100%', background: file.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <IconBrandFigma size={48} color="var(--border)" />
               <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text)' }}>
                 {file.type}
               </div>
            </div>
            {/* File Info */}
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>{file.name}</h3>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconEye size={16} /> {file.views} views</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconHeart size={16} /> {file.likes} likes</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
