"use client";

import Link from "next/link";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { Container } from "@mantine/core";
import { getAuthHeaders } from "@/lib/api";
import s from "./page.module.css";

/* ── Animated counter ── */
function AnimCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const step = Math.ceil(target / 55);
      let cur = 0;
      const id = setInterval(() => {
        cur = Math.min(cur + step, target);
        setVal(cur);
        if (cur >= target) clearInterval(id);
      }, 18);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}{suffix}</span>;
}

/* ── Per-section scroll reveal ── */
function useReveal() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add(s.visible); obs.disconnect(); } },
      { threshold: 0.04, rootMargin: "0px 0px -24px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Live feed ── */
const FEED = [
  { av: "PK", name: "Priya K.", action: "posted a React.js swap request", time: "just now", col: "ember" },
  { av: "RM", name: "Rohan M.", action: "joined team Nebula for the Hackathon", time: "2m ago", col: "spark" },
  { av: "KS", name: "Kabir S.", action: "uploaded Linear Algebra notes", time: "8m ago", col: "ember" },
  { av: "DS", name: "Diya S.", action: "matched with a Python tutor", time: "15m ago", col: "spark" },
  { av: "NJ", name: "Neha J.", action: "scored 94% on the DSA quiz", time: "21m ago", col: "ember" },
];

/* ── SVG Illustrations ── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 500 440" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={s.heroIllustration} aria-label="Grid workspace illustration">
      {/* Background glow */}
      <circle cx="300" cy="220" r="200" fill="var(--accent)" opacity={0.04} />

      {/* Desk */}
      <rect x="40" y="300" width="400" height="6" fill="var(--accent-2)" opacity={0.5} />

      {/* Monitor */}
      <rect x="150" y="155" width="200" height="135" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth="2.5" />
      <rect x="162" y="167" width="176" height="111" fill="var(--bg-3)" />

      {/* Code on screen with syntax colors */}
      <rect x="172" y="178" width="70" height="3.5" fill="var(--accent)" opacity={0.8} />
      <rect x="172" y="188" width="130" height="3.5" fill="var(--accent-2)" opacity={0.7} />
      <rect x="172" y="198" width="55" height="3.5" fill="var(--text-muted)" opacity={0.5} />
      <rect x="172" y="208" width="110" height="3.5" fill="var(--accent)" opacity={0.6} />
      <rect x="172" y="218" width="90" height="3.5" fill="var(--accent-2)" opacity={0.5} />
      <rect x="172" y="228" width="45" height="3.5" fill="var(--text-muted)" opacity={0.4} />
      <rect x="172" y="238" width="100" height="3.5" fill="var(--accent)" opacity={0.55} />
      <rect x="172" y="248" width="75" height="3.5" fill="var(--accent-2)" opacity={0.4} />

      {/* Stand */}
      <rect x="238" y="288" width="24" height="14" fill="var(--border)" />
      <rect x="222" y="300" width="56" height="4" fill="var(--border)" />

      {/* Keyboard */}
      <rect x="162" y="314" width="176" height="20" fill="var(--bg-3)" stroke="var(--border)" strokeWidth="1.5" />
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x={170 + i*26} y={320} width={20} height={8} fill="var(--border)" />
      ))}

      {/* Stacked books left */}
      <rect x="65" y="282" width="66" height="9" fill="var(--accent)" />
      <rect x="69" y="273" width="58" height="9" fill="var(--accent-2)" />
      <rect x="65" y="264" width="62" height="9" fill="var(--bg-3)" stroke="var(--border)" strokeWidth="1" />

      {/* Coffee cup right */}
      <rect x="386" y="272" width="32" height="28" fill="var(--bg-3)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M418 280 Q430 280 430 286 Q430 292 418 292" stroke="var(--border)" strokeWidth="1.5" fill="none" />
      <rect x="391" y="275" width="22" height="4" fill="var(--accent)" opacity={0.4} />

      {/* Floating "Match Found" badge */}
      <g className={s.floatBob} style={{ transformOrigin: "410px 90px" }}>
        <rect x="365" y="55" width="110" height="68" fill="var(--accent)" />
        <rect x="365" y="55" width="4" height="68" fill="rgba(0,0,0,0.2)" />
        <text x="422" y="85" textAnchor="middle" fill="#fff"
          style={{ fontFamily: "var(--font-space)", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>
          MATCH FOUND
        </text>
        <text x="422" y="102" textAnchor="middle" fill="rgba(255,255,255,0.75)"
          style={{ fontFamily: "var(--font-space)", fontSize: 9 }}>
          React.js ↔ Python
        </text>
        {/* Checkmark */}
        <circle cx="395" cy="91" r="0" fill="rgba(255,255,255,0.2)" />
      </g>

      <g className={s.floatBob2} style={{ transformOrigin: "85px 360px" }}>
        <rect x="48" y="326" width="74" height="68" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth="2" />
        <rect x="48" y="326" width="74" height="4" fill="var(--accent)" />
        <text x="85" y="356" textAnchor="middle" fill="var(--accent)"
          style={{ fontFamily: "var(--font-space)", fontSize: 20, fontWeight: 700 }}>
          A+
        </text>
        <text x="85" y="373" textAnchor="middle" fill="var(--text-muted)"
          style={{ fontFamily: "var(--font-space)", fontSize: 8, letterSpacing: "0.08em" }}>
          GRADE
        </text>
      </g>

      {/* Triangle corner accent */}
      <polygon points="0,0 100,0 0,100" fill="var(--accent)" opacity={0.08} />

      {/* Connection dots + lines */}
      <line x1="365" y1="120" x2="258" y2="167" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx="365" cy="120" r="4" fill="var(--accent)" />
      <line x1="122" y1="326" x2="162" y2="300" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx="122" cy="326" r="4" fill="var(--accent-2)" />

      {/* Bottom decoration */}
      <rect x="40" y="400" width="140" height="3" fill="var(--accent)" opacity={0.3} />
      <rect x="190" y="400" width="60" height="3" fill="var(--accent-2)" opacity={0.3} />
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    skills: (
      <svg viewBox="0 0 44 44" fill="none">
        <rect x="3" y="3" width="17" height="17" fill="var(--accent)" />
        <rect x="24" y="3" width="17" height="17" fill="var(--accent-2)" opacity={0.7} />
        <rect x="3" y="24" width="17" height="17" fill="var(--accent-2)" opacity={0.7} />
        <rect x="24" y="24" width="17" height="17" fill="var(--accent)" opacity={0.5} />
      </svg>
    ),
    discuss: (
      <svg viewBox="0 0 44 44" fill="none">
        <rect x="4" y="6" width="30" height="22" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <rect x="10" y="13" width="12" height="3" fill="var(--accent)" opacity={0.8} />
        <rect x="10" y="20" width="18" height="3" fill="var(--accent-2)" opacity={0.7} />
        <polygon points="14,28 14,38 24,28" fill="var(--accent)" />
      </svg>
    ),
    events: (
      <svg viewBox="0 0 44 44" fill="none">
        <rect x="4" y="9" width="36" height="28" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <line x1="4" y1="17" x2="40" y2="17" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="14" cy="5" r="3" fill="var(--accent-2)" />
        <circle cx="30" cy="5" r="3" fill="var(--accent-2)" />
        <rect x="11" y="22" width="9" height="9" fill="var(--accent)" />
        <rect x="24" y="22" width="9" height="9" fill="var(--accent-2)" opacity={0.7} />
      </svg>
    ),
    quiz: (
      <svg viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <rect x="19" y="10" width="6" height="14" fill="var(--accent)" />
        <rect x="19" y="28" width="6" height="6" fill="var(--accent-2)" />
      </svg>
    ),
    projects: (
      <svg viewBox="0 0 44 44" fill="none">
        <polygon points="22,3 41,39 3,39" fill="var(--accent)" opacity={0.9} />
        <rect x="19" y="14" width="6" height="14" fill="var(--accent-2)" />
        <circle cx="22" cy="32" r="5" fill="var(--bg)" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 44 44" fill="none">
        <rect x="3" y="7" width="28" height="20" fill="var(--accent)" />
        <rect x="13" y="21" width="28" height="18" fill="var(--accent-2)" opacity={0.75} />
        <rect x="8" y="13" width="14" height="3" fill="white" opacity={0.6} />
        <rect x="8" y="20" width="8" height="3" fill="white" opacity={0.4} />
      </svg>
    ),
    roast: (
      <svg viewBox="0 0 44 44" fill="none">
        <path d="M22 4C22 4 14 16 14 26C14 34 22 40 22 40C22 40 30 34 30 26C30 16 22 4 22 4Z" fill="var(--accent)" />
        <circle cx="22" cy="28" r="4" fill="var(--bg)" />
      </svg>
    ),
    pow: (
      <svg viewBox="0 0 44 44" fill="none">
        <path d="M22 6 L36 14 L36 30 L22 38 L8 30 L8 14 Z" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx="22" cy="22" r="3" fill="var(--accent-2)" />
        <path d="M22 6 L22 22 M36 14 L22 22 M8 14 L22 22 M36 30 L22 22 M8 30 L22 22" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" />
      </svg>
    ),
    community: (
      <svg viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="14" r="6" fill="var(--accent)" />
        <path d="M12 36C12 28 32 28 32 36" stroke="var(--accent-2)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="12" cy="18" r="4" fill="var(--accent-2)" opacity="0.6" />
        <circle cx="32" cy="18" r="4" fill="var(--accent-2)" opacity="0.6" />
      </svg>
    ),
  };
  return <div style={{ width: '100%', height: '100%' }}>{map[type] ?? map.skills}</div>;
}
/* ── Testimonials ── */
const TESTIMONIALS = [
  { name: "Priya K.", role: "3rd Year, CSE", text: "Found a Python tutor in 20 minutes. Taught her React in return. This is how campus should work.", initials: "PK", col: "ember" },
  { name: "Arjun R.", role: "Final Year, IT", text: "Built my capstone project team entirely on Grid. Four people, four skill sets, one week.", initials: "AR", col: "spark" },
  { name: "Sneha V.", role: "2nd Year, Design", text: "The discussion forum answered my elective questions better than any advisor ever did.", initials: "SV", col: "ember" },
];


/* ── Breathtaking Parallax Feature Card ── */
function AnimatedFeatureCard({ feature, index }: { feature: any, index: number }) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [mouse, setMouse] = React.useState({ x: 0, y: 0, px: 0, py: 0, isHovered: false });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.25, rootMargin: "0px 0px -100px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate parallax offsets (-1 to 1)
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;

    setMouse({ x, y, px, py, isHovered: true });
  };

  const handleMouseLeave = () => {
    setMouse(p => ({ ...p, px: 0, py: 0, isHovered: false }));
  };

  const delay = (index % 4) * 100;

  return (
    <Link 
      href={feature.href} 
      ref={ref}
      className={`${s.featureCard} ${isVisible ? s.cardVisible : ''} ${s[`bento_${index}`] || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        "--card-delay": `${delay}ms`,
        "--mouse-x": `${mouse.x}px`,
        "--mouse-y": `${mouse.y}px`,
      } as React.CSSProperties}
    >
      <div className={s.cardGlow} />
      
      {/* Brutalist visual side with massive graphic */}
      <div 
        className={s.featureVisualWrap}
        style={{ 
          transform: mouse.isHovered ? `translate3d(${mouse.px * -15}px, ${mouse.py * -15}px, 0) scale(1.02)` : 'translate3d(0,0,0) scale(1)',
          transition: mouse.isHovered ? 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className={s.hugeVisualNumber}>0{index + 1}</div>
        <div className={s.hugeVisualIcon}><FeatureIcon type={feature.type} /></div>
      </div>
      
      {/* Foreground content with subtle parallax */}
      <div 
        className={s.featureContentWrap}
        style={{ 
          transform: mouse.isHovered ? `translate3d(${mouse.px * 8}px, ${mouse.py * 8}px, 0)` : 'translate3d(0,0,0)',
          transition: mouse.isHovered ? 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {feature.tag && <span className={s.featureTag}>{feature.tag}</span>}
        
        <div className={s.featureTextWrap}>
          <h3 className={s.featureTitle}>{feature.title}</h3>
          <p className={s.featureDesc}>{feature.desc}</p>
        </div>
      </div>
    </Link>
  );
}

/* ── Main Page ── */
export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Record<string, number> | null>(null);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [swapTab, setSwapTab] = React.useState(0);
  const [swapStatus, setSwapStatus] = React.useState<"idle" | "loading" | "done">("idle");
  const [feedIdx, setFeedIdx] = React.useState(0);

  const r0 = useReveal();
  const r1 = useReveal();
  const r2 = useReveal();
  const r3 = useReveal();
  const r4 = useReveal();
  const r5 = useReveal();
  const r6 = useReveal();

  React.useEffect(() => {
    const id = setInterval(() => setFeedIdx(i => (i + 1) % FEED.length), 3000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/stats", { headers: getAuthHeaders() });
        if (r.ok) setStats(await r.json());
      } catch {}
    })();
  }, []);

  const features = [
    { type: "skills",   title: "Skill Marketplace", desc: "Teach what you know. Learn what you need. Direct peer-to-peer exchange, zero middlemen.",         href: "/skills",      tag: "CORE" },
    { type: "discuss",  title: "Discussion Forums",  desc: "Course questions, elective advice, senior mentors. Your academic network, organised.",              href: "/discussions", tag: "POPULAR" },
    { type: "events",   title: "Events & Hackathons",desc: "Club drives, workshops, inter-college hackathons. One calendar for everything campus.",             href: "/events",      tag: "POPULAR" },
    { type: "quiz",     title: "Study Quizzes",      desc: "Test yourself, track growth, climb the campus scoreboard. Know exactly where you stand.",           href: "/quizzes",     tag: "POPULAR" },
    { type: "projects", title: "Project Teams",      desc: "Post your idea, recruit by skill, build together. From college assignments to actual startups.",     href: "/projects",    tag: "HOT" },
    { type: "chat",     title: "Real-time Chat",     desc: "DMs, group rooms, skill-session scheduling. Everything you need to coordinate in one thread.",       href: "/chat",        tag: "HOT" },
    { type: "roast", title: "Resume Roast", desc: "Get constructive, brutal feedback on your resume from peers and alumni to land that internship.", href: "/roast", tag: "TRENDING" },
    { type: "pow", title: "Cryptographic PoW", desc: "Resumes are dead. Grid connects to your GitHub & Figma, analyzing raw commits to generate an unfakeable, verified skill graph.", href: "/pow", tag: "NEXT-GEN" },
    { type: "community", title: "Communities", desc: "Join dedicated groups, or niche interests to network.", href: "/community", tag: "TRENDING" },
  ];

  const swapData = [
    [
      { name: "Priya Patel",  year: 2, offers: "React.js",      wants: "Python",         av: "PP", col: "ember" },
      { name: "Rohan Mehta",  year: 3, offers: "Django API",    wants: "Kotlin",         av: "RM", col: "spark" },
    ],
    [
      { name: "Sneha Sen",    year: 1, offers: "Figma / UI",    wants: "3D Blender",     av: "SS", col: "ember" },
      { name: "Arjun Rao",    year: 4, offers: "CAD / SolidWorks", wants: "Web Dev",    av: "AR", col: "spark" },
    ],
    [
      { name: "Kabir Singh",  year: 3, offers: "Calculus II",   wants: "Linear Algebra", av: "KS", col: "ember" },
      { name: "Diya Shah",    year: 2, offers: "Physics",       wants: "Python Basics",  av: "DS", col: "spark" },
    ],
  ];

  const faqs = [
    { q: "Is Grid free to use?",         a: "Completely free. No subscription, no hidden fees, no paywalls. Skill swaps, quizzes, project listings — all free." },
    { q: "How does Skill Swap work?",      a: "List skills you can teach and skills you want to learn. Grid matches you with a peer offering the exact trade. You schedule a session; they get yours in return." },
    { q: "Can seniors offer mentorship?",  a: "Yes. Senior students and alumni create mentor profiles listing their expertise. Juniors browse and book time directly — no intermediary required." },
    { q: "How do I build a project team?", a: "Post your project with the skills you need. Interested students apply. You review their profiles and skill-swap history before accepting." },
    { q: "How are achievements earned?",   a: "Contributions earn XP: uploading notes, answering threads, completing swaps, scoring in quizzes. XP unlocks badges visible on your profile." },
  ];

  return (
    <>
      <Navbar />

      {/* ── Desktop Hero Section ── */}
      <section 
        className={s.hero3D}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          e.currentTarget.style.setProperty('--rotX', `${-y * 15}deg`);
          e.currentTarget.style.setProperty('--rotY', `${x * 15}deg`);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty('--rotX', '0deg');
          e.currentTarget.style.setProperty('--rotY', '0deg');
        }}
      >
        <div className={s.world3D}>
          {/* Infinite Floor */}
          <div className={s.gridFloor} />

          {/* Massive Cyber Text */}
          <div className={s.titleLayerBack}>GRID</div>

          {/* Advanced Orbital Rings */}
          <div className={s.orbitalSystem}>
            <div className={`${s.ring} ${s.ring1}`} />
            <div className={`${s.ring} ${s.ring2}`} />
            <div className={`${s.ring} ${s.ring3}`} />
          </div>

          {/* Floating Nodes in 3D Space */}
          <div className={s.node3D} style={{ '--tx': '-420px', '--ty': '-200px', '--tz': '150px', '--rx': '-10deg', '--ry': '15deg' } as React.CSSProperties}>
            <span className={s.nodeTag}>CRYPTOGRAPHY</span>
            <div className={s.nodeAvatar} style={{ background: 'var(--accent-2)' }} />
            <span className={s.nodeTitle}>Unfakeable Proof</span>
          </div>

          <div className={s.node3D} style={{ '--tx': '240px', '--ty': '-240px', '--tz': '80px', '--rx': '5deg', '--ry': '-20deg' } as React.CSSProperties}>
            <span className={s.nodeTag}>P2P NETWORK</span>
            <div className={s.nodeAvatar} style={{ background: 'var(--accent)' }} />
            <span className={s.nodeTitle}>Direct Skill Swap</span>
          </div>

          <div className={s.node3D} style={{ '--tx': '-440px', '--ty': '20px', '--tz': '250px', '--rx': '-15deg', '--ry': '10deg' } as React.CSSProperties}>
            <span className={s.nodeTag}>STARTUPS</span>
            <div className={s.nodeAvatar} style={{ background: '#fff' }} />
            <span className={s.nodeTitle}>Project Teams</span>
          </div>

          <div className={s.node3D} style={{ '--tx': '260px', '--ty': '40px', '--tz': '300px', '--rx': '20deg', '--ry': '-15deg' } as React.CSSProperties}>
            <span className={s.nodeTag}>VERIFIED</span>
            <div className={s.nodeAvatar} style={{ background: 'var(--accent-2)' }} />
            <span className={s.nodeTitle}>GitHub + Figma</span>
          </div>

          {/* Central Title */}
          <div className={s.titleLayerFront}>
            <h1 className={s.killerTitle}>
              <span className={`${s.kWord} ${s.kWord1}`} style={{ '--z': '20px' } as React.CSSProperties}>Build </span>
              <span className={`${s.kWord} ${s.kWord2}`} style={{ '--z': '50px' } as React.CSSProperties}>Ship</span>
              <span className={`${s.kWord} ${s.kWord3}`} style={{ '--z': '80px' } as React.CSSProperties}>Dominate</span>
            </h1>
            <p className={s.killerSub}>
              Trade skills, assemble high-impact project teams, and build your reputation. 
              Grid is the ultimate professional network for university students, 
              engineered for real collaboration without the noise.
            </p>
            <div className={s.killerCta}>
              <Link href="/signup" className={s.btnCyber}>
                ENTER THE GRID
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className={s.section}>
        <div ref={r1} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.sectionHeader}>
              <div className={s.sectionTag}>
                <div className={s.tagBar} />
                <span>PLATFORM</span>
              </div>
              <h2 className={s.sectionTitle}>
                Built for how students<br />actually work
              </h2>
              <p className={s.sectionSub}>
                Nine tools. One platform. Zero bloat.
              </p>
            </div>

            <div className={s.featuresGridWrap}>
              <div className={s.featuresGlow} aria-hidden="true" />
              <div className={s.featuresGrid}>
                {features.map((f, i) => (
                  <AnimatedFeatureCard key={i} feature={f} index={i} />
                ))}
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div ref={r2} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.sectionHeader}>
              <div className={s.sectionTag}>
                <div className={s.tagBar} style={{ background: "var(--accent-2)" }} />
                <span>PROCESS</span>
              </div>
              <h2 className={s.sectionTitle}>From signup to shipping in four steps</h2>
            </div>

            <div className={s.stepsGrid}>
              {[
                { n: "01", t: "Build your Grid profile", d: "Skills you teach. Skills you want. Your year, projects. Your professional campus identity.", col: "ember" },
                { n: "02", t: "Find your skill match",    d: "Browse the Skill Marketplace. Request a swap. Schedule a session with someone who has what you need.", col: "spark" },
                { n: "03", t: "Ship a real project",       d: "Post your idea. Recruit by skill. Coordinate in a dedicated project room. Build something real.",        col: "ember" },
                { n: "04", t: "Earn your reputation",     d: "Every contribution earns XP and badges. Your profile becomes proof of what you can actually do.",         col: "spark" },
              ].map((step, i) => (
                <div key={i} className={s.stepCard}
                  style={{ "--step-delay": `${i * 100}ms` } as React.CSSProperties}>
                  <div className={s.stepNum}
                    style={{
                      background: step.col === "ember" ? "var(--accent)" : "var(--accent-2)",
                      color: step.col === "ember" ? "#fff" : "#0D0C0B",
                    }}>
                    {step.n}
                  </div>
                  <h3 className={s.stepTitle}>{step.t}</h3>
                  <p className={s.stepDesc}>{step.d}</p>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </section>

      {/* ─── SKILL SWAP DEMO ──────────────────────────────────── */}
      <section className={s.section}>
        <div ref={r3} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.swapLayout}>
              <div className={s.swapLeft}>
                <div className={s.sectionTag}>
                  <div className={s.tagBar} />
                  <span>LIVE DEMO</span>
                </div>
                <h2 className={s.sectionTitle} style={{ marginTop: 16 }}>
                  The Skill Swap engine — live
                </h2>
                <p className={s.swapCopy}>
                  Select a skill category. Hit swap. See how Grid matches two students
                  with complementary needs in under 2 seconds.
                </p>
                <div className={s.swapMeta}>
                  <div className={s.swapMetaItem}>
                    <span className={s.swapMetaNum}>2s</span>
                    <span className={s.swapMetaLabel}>avg match time</span>
                  </div>
                  <div className={s.swapMetaDivider} />
                  <div className={s.swapMetaItem}>
                    <span className={s.swapMetaNum}>94%</span>
                    <span className={s.swapMetaLabel}>satisfaction rate</span>
                  </div>
                </div>
              </div>

              <div className={s.swapWidget}>
                <div className={s.swapTabs}>
                  {["Development", "Creative", "Academic"].map((t, i) => (
                    <button key={i}
                      className={`${s.swapTab} ${swapTab === i ? s.swapTabActive : ""}`}
                      onClick={() => { setSwapTab(i); setSwapStatus("idle"); }}>
                      {t}
                    </button>
                  ))}
                </div>

                <div className={s.swapCards}>
                  {swapStatus === "loading" && (
                    <div className={s.swapOverlay}>
                      <div className="squareSpinner" />
                      <p>Finding best match...</p>
                    </div>
                  )}
                  {swapStatus === "done" && (
                    <div className={`${s.swapOverlay} ${s.swapDone}`}>
                      <svg viewBox="0 0 48 48" fill="none" width="52" height="52">
                        <rect x="2" y="2" width="44" height="44" fill="none" stroke="#fff" strokeWidth="2.5" />
                        <polyline points="12,24 22,34 38,16" stroke="#fff" strokeWidth="3.5" />
                      </svg>
                      <p className={s.doneTitle}>Match found!</p>
                      <p className={s.doneSub}>Chat room created. Schedule your first session.</p>
                      <button className={s.doneReset} onClick={() => setSwapStatus("idle")}>Try another</button>
                    </div>
                  )}
                  {swapData[swapTab].map((c, i) => (
                    <div key={`${swapTab}-${i}`} className={s.swapCard}
                      style={{ "--swap-delay": `${i * 70}ms` } as React.CSSProperties}>
                      <div className={s.swapAv}
                        style={{
                          background: c.col === "ember" ? "var(--accent)" : "var(--accent-2)",
                          color:      c.col === "ember" ? "#fff"          : "#0D0C0B",
                        }}>
                        {c.av}
                      </div>
                      <div className={s.swapInfo}>
                        <strong>{c.name}</strong>
                        <span>Year {c.year}</span>
                        <div className={s.swapBadges}>
                          <span className={s.bRed}>Teaches: {c.offers}</span>
                          <span className={s.bYellow}>Wants: {c.wants}</span>
                        </div>
                      </div>
                      <button className={s.swapBtn}
                        onClick={() => { setSwapStatus("loading"); setTimeout(() => setSwapStatus("done"), 1300); }}>
                        Request swap
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ─── STATS + LIVE FEED ────────────────────────────────── */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div ref={r4} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.statsLayout}>
              <div className={s.statBigBlock}>
                <div className={s.statBig} style={{ color: "var(--accent)" }}>
                  <AnimCounter target={stats?.users ?? 0} />
                </div>
                <div className={s.statBigLabel}>Students on Grid</div>
                <div className={s.statBigBar} style={{ background: "var(--accent)" }} />
              </div>
              <div className={s.statBigBlock}>
                <div className={s.statBig} style={{ color: "var(--accent-2)" }}>
                  <AnimCounter target={stats?.projects ?? 0} />
                </div>
                <div className={s.statBigLabel}>Projects shipped</div>
                <div className={s.statBigBar} style={{ background: "var(--accent-2)" }} />
              </div>
              <div className={s.statBigBlock}>
                <div className={s.statBig} style={{ color: "var(--accent)" }}>
                  <AnimCounter target={stats?.discussions ?? 0} />
                </div>
                <div className={s.statBigLabel}>Active discussions</div>
                <div className={s.statBigBar} style={{ background: "var(--accent)" }} />
              </div>

              {/* Live feed */}
              <div className={s.liveFeed}>
                <div className={s.liveHeader}>
                  <span className={s.liveDot} />
                  <span className={s.liveText}>LIVE ACTIVITY</span>
                </div>
                <div className={s.feedWin}>
                  {FEED.map((item, i) => (
                    <div key={i} className={`${s.feedItem} ${i === feedIdx ? s.feedActive : ""}`}>
                      <div className={s.feedAv}
                        style={{
                          background: item.col === "ember" ? "var(--accent)" : "var(--accent-2)",
                          color:      item.col === "ember" ? "#fff"          : "#0D0C0B",
                        }}>
                        {item.av}
                      </div>
                      <div className={s.feedBody}>
                        <span><strong>{item.name}</strong> {item.action}</span>
                        <span className={s.feedTime}>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className={s.section}>
        <div ref={r5} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.sectionHeader}>
              <div className={s.sectionTag}>
                <div className={s.tagBar} style={{ background: "var(--accent-2)" }} />
                <span>WHAT THEY SAY</span>
              </div>
              <h2 className={s.sectionTitle}>Real students. Real results.</h2>
            </div>
            <div className={s.testimonialsGrid}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={s.testimonialCard}
                  style={{ "--t-delay": `${i * 90}ms` } as React.CSSProperties}>
                  <div className={s.tAccent}
                    style={{ background: t.col === "ember" ? "var(--accent)" : "var(--accent-2)" }} />
                  <p className={s.tText}>{t.text}</p>
                  <div className={s.tAuthor}>
                    <div className={s.tAv}
                      style={{
                        background: t.col === "ember" ? "var(--accent)" : "var(--accent-2)",
                        color:      t.col === "ember" ? "#fff"          : "#0D0C0B",
                      }}>
                      {t.initials}
                    </div>
                    <div>
                      <strong className={s.tName}>{t.name}</strong>
                      <span className={s.tRole}>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div ref={r6} className={s.revealBlock}>
          <Container size="xl">
            <div className={s.faqLayout}>
              <div className={s.faqLeft}>
                <div className={s.sectionTag}>
                  <div className={s.tagBar} />
                  <span>FAQ</span>
                </div>
                <h2 className={s.sectionTitle} style={{ marginTop: 16 }}>
                  Questions answered.
                </h2>
                <div className={s.faqDecor} aria-hidden="true">
                  <div style={{ width: 72, height: 72, background: "var(--accent)" }} />
                  <div style={{ width: 72, height: 72, background: "var(--accent-2)", marginTop: 10 }} />
                  <div style={{ width: 72, height: 144, background: "var(--bg-3)", marginTop: 10, border: "2px solid var(--border)" }} />
                </div>
              </div>
              <div className={s.faqRight}>
                {faqs.map((f, i) => (
                  <div key={i} className={s.faqItem}>
                    <button className={s.faqQ}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{f.q}</span>
                      <span className={`${s.faqIcon} ${openFaq === i ? s.faqIconOpen : ""}`}>
                        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                          <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2.5"
                            style={{ opacity: openFaq === i ? 0 : 1, transition: "opacity 0.2s" }} />
                        </svg>
                      </span>
                    </button>
                    <div className={`${s.faqBody} ${openFaq === i ? s.faqBodyOpen : ""}`}>
                      <p className={s.faqAns}>{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className={s.ctaSection}>
        <Container size="xl">
          <div className={s.ctaInner}>
            <div className={s.ctaDecor} aria-hidden="true">
              <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.12)" }} />
              <div style={{ width: 56, height: 56, background: "var(--accent-2)", marginTop: 10 }} />
            </div>
            <div>
              <h2 className={s.ctaTitle}>
                Your campus.<br />Your community.<br />Your grid.
              </h2>
              <p className={s.ctaSub}>
                Join the students who are trading skills,
                building projects, and owning their academic journey.
              </p>
              <div className={s.ctaBtns}>
                {!user ? (
                  <>
                    <Link href="/signup" className={s.ctaBtnPrimary} id="cta-signup-btn">
                      Create free account
                    </Link>
                    <Link href="/login" className={s.ctaBtnGhost} id="cta-login-btn">
                      Sign in
                    </Link>
                  </>
                ) : (
                  <Link href="/profile" className={s.ctaBtnPrimary} id="cta-profile-btn">
                    Go to dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className={s.footer}>
        <Container size="xl">
          <div className={s.footerGrid}>
            <div>
              <div className={s.footerBrand}>
                <svg viewBox="0 0 28 28" fill="none" width={22} height={22}>
                  <rect x="3" y="9" width="22" height="12" fill="var(--accent)" />
                  <rect x="9" y="3" width="10" height="7" fill="var(--accent)" opacity={0.7} />
                  <rect x="0" y="19" width="28" height="4" fill="var(--accent)" opacity={0.4} />
                  <circle cx="23" cy="5" r="2.5" fill="var(--accent-2)" />
                </svg>
                <span>Grid</span>
              </div>
              <p className={s.footerTagline}>
                The peer-driven platform where university<br />students build skills and ship projects.
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
                <div style={{ width: 16, height: 16, background: "var(--accent)" }} />
                <div style={{ width: 16, height: 16, background: "var(--accent-2)" }} />
                <div style={{ width: 16, height: 16, background: "var(--border)" }} />
              </div>
            </div>
            {[
              { label: "Platform", links: [{ t:"Skills",h:"/skills"},{t:"Projects",h:"/projects"},{t:"Discuss",h:"/discussions"},{t:"Quizzes",h:"/quizzes"},{t:"Roast",h:"/roast"}] },
              { label: "Community",links: [{ t:"Events",h:"/events"},{t:"Chat",h:"/chat"},{t:"People",h:"/users"},{t:"Groups",h:"/community"}] },
              { label: "Legal",    links: [{ t:"Privacy",h:"/privacy"},{t:"Terms",h:"/terms"},{t:"Guidelines",h:"/guidelines"}] },
            ].map((col, i) => (
              <div key={i} className={s.footerCol}>
                <span className={s.footerColLabel}>{col.label}</span>
                {col.links.map((l, j) => (
                  <Link key={j} href={l.h} className={s.footerLink}>{l.t}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className={s.footerBottom}>
            <div className={s.footerRule} />
            <span>© {new Date().getFullYear()} Grid — Built by students, for students.</span>
          </div>
        </Container>
      </footer>
    </>
  );
}
