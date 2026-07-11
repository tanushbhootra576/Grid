"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { IconLayoutDashboard, IconGitBranch, IconBrandFigma, IconNetwork } from "@tabler/icons-react";
import s from "./pow.module.css";

export default function PoWLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NAV = [
    { label: "Overview", icon: IconLayoutDashboard, href: "/pow" },
    { label: "Repositories", icon: IconGitBranch, href: "/pow/projects" },
    { label: "Design", icon: IconBrandFigma, href: "/pow/design" },
    { label: "Network", icon: IconNetwork, href: "/pow/network" },
  ];

  return (
    <div className={s.layout}>
      <Navbar />

      <header className={s.header}>
        <div className={s.profileInfo}>
          <div className={s.avatar}>T</div>
          <div>
            <h1 className={s.name}>
              Tanush Bhootra
              <span className={s.badge}>
                <div style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} /> 
                Verified Passport
              </span>
            </h1>
            <p className={s.bio}>Full-stack engineer and UI/UX designer. Building scalable web applications and crafting pixel-perfect interfaces.</p>
          </div>
        </div>

        <nav className={s.tabs}>
          {NAV.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${s.tab} ${isActive ? s.tabActive : ""}`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className={s.content}>
        {children}
      </main>
    </div>
  );
}
