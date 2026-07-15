"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import {
  IconSearch,
  IconMail,
  IconBrandGmail,
  IconBrandWindows,
  IconBrandYahoo,
  IconMessage,
  IconX,
  IconShieldCheck,
} from "@tabler/icons-react";

import Link from "next/link";
import { getAuthHeaders } from "@/lib/api";
import {
  CollaborationBadge,
  CollaborationLevel,
} from "@/components/CollaborationStatus";
import g from "../grid.module.css";

interface ListedUser {
  _id: string;
  publicId?: string;
  name: string;
  email: string;
  year?: number;
  skills: string[];
  interests: string[];
  role: string;
  verified?: boolean;
  collaborationStatus?: {
    level: CollaborationLevel;
    visible: boolean;
  };
}


interface UsersResponse {
  users: ListedUser[];
  page: number;
  total: number;
  totalPages: number;
}

export const dynamic = "force-dynamic";

export default function UsersDirectoryPage() {
  const [search, setSearch] = useState("");

  const [skill, setSkill] = useState("");
  const [cofounder, setCofounder] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactUser, setContactUser] = useState<ListedUser | null>(null);
  const [contactOpened, setContactOpened] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "18");
      if (search) params.append("search", search);

      if (skill) params.append("skill", skill);
      if (cofounder) params.append("cofounder", "true");
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const initialSearch = sp.get("search");

      const initialSkill = sp.get("skill");
      const initialCofounder = sp.get("cofounder");
      if (initialSearch) setSearch(initialSearch);

      if (initialSkill) setSkill(initialSkill);
      if (initialCofounder === "true") setCofounder(true);
      const initialPage = sp.get("page");
      if (initialPage) setPage(parseInt(initialPage, 10) || 1);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    if (skill) params.set("skill", skill);
    if (cofounder) params.set("cofounder", "true");
    params.set("page", String(page));
    router.replace(`/users?${params.toString()}`);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, skill, cofounder, page]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="squareSpinner" />}>
        <div className={g.container}>
          <div className={g.headerRow}>
            <h1 className={g.title}>
              <div className={g.titleAccent} />
              User Directory
            </h1>
          </div>

            <div className={g.controlsRow} style={{ alignItems: 'center' }}>
              <div className={g.inputGroup}>
                <IconSearch size={18} className={g.inputIcon} />
                <input
                  type="text"
                  className={g.input}
                  placeholder="Search name, email, skill..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <input
                type="text"
                className={g.input}
                placeholder="Filter by skill..."
                style={{ border: '1px solid var(--border)', background: 'var(--bg-2)', minWidth: 200, flex: 0 }}
                value={skill}
                onChange={(e) => {
                  setSkill(e.target.value);
                  setPage(1);
                }}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-space)', fontSize: '0.9rem', color: 'var(--text)' }}>
                <input 
                  type="checkbox" 
                  checked={cofounder} 
                  onChange={(e) => { setCofounder(e.target.checked); setPage(1); }} 
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} 
                />
                Looking for Co-founder
              </label>
            </div>

          {loading ? (
            <div className="squareSpinner" />
          ) : (
            <div className={g.grid}>
              {data?.users && data.users.map((u) => (
                <div key={u._id} className={g.card}>
                  <div className={g.cardTop} style={{ background: 'var(--text)' }} />
                  <div className={g.cardBody}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontFamily: 'var(--font-space)', fontWeight: 700, flexShrink: 0 }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                            <h3 className={g.cardTitle} style={{ marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</h3>
                            {u.verified && (
                              <span
                                title="Student ID Verified"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 2,
                                  fontSize: '0.65rem', fontWeight: 700, color: '#22c55e',
                                  border: '1px solid #22c55e', padding: '1px 5px',
                                  flexShrink: 0, lineHeight: 1.4,
                                }}
                              >
                                <IconShieldCheck size={10} stroke={3} /> ID
                              </span>
                            )}
                          </div>
                          <span className={g.badge} style={{ borderColor: 'var(--text-muted)', color: 'var(--text)', flexShrink: 0, marginLeft: 8 }}>{u.role}</span>
                        </div>
                        <p className={g.cardDesc} style={{ marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.year ? `Year ${u.year}` : "Year not set"}
                        </p>
                        {u.collaborationStatus?.visible && (
                          <div style={{ marginTop: 8 }}>
                            <CollaborationBadge level={u.collaborationStatus.level} size="xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1, marginBottom: 24 }}>
                      {u.skills && u.skills.length > 0 ? (
                        <>
                          <div style={{ fontFamily: 'var(--font-space)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Skills</div>
                          <div className={g.tagList}>
                            {u.skills.slice(0, 3).map((s) => (
                              <span key={s} className={g.tag}>{s}</span>
                            ))}
                            {u.skills.length > 3 && (
                              <span className={g.tag} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                                +{u.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skills added.</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                      <button className={g.btn} style={{ flex: 1, padding: '10px' }} onClick={() => { setContactUser(u); setContactOpened(true); }}>CONTACT</button>
                      <Link href={`/users/${u.publicId ?? u._id}`} className={`${g.btn} ${g.btnPrimary}`} style={{ flex: 1, padding: '10px' }}>PROFILE</Link>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && data?.users.length === 0 && (
                <div className={g.empty}>No users found matching your search criteria.</div>
              )}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className={g.pagination}>
              <button 
                className={g.pageBtn} 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button 
                  key={i + 1} 
                  className={`${g.pageBtn} ${page === i + 1 ? g.active : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                className={g.pageBtn} 
                disabled={page === data.totalPages} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {contactOpened && contactUser && (
          <div className={g.modalBackdrop}>
            <div className={g.modal}>
              <div className={g.modalHeader}>
                <h2 className={g.modalTitle}>Contact {contactUser.name}</h2>
                <button className={g.closeBtn} onClick={() => setContactOpened(false)}><IconX size={24} /></button>
              </div>
              <div className={g.modalBody}>
                <button 
                  className={g.btn} 
                  style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--accent)', color: '#fff' }}
                  onClick={() => {
                    setContactOpened(false);
                    router.push(`/chat?dm=${contactUser.publicId ?? contactUser._id}`);
                  }}
                >
                  <IconMessage size={20} /> Direct Message
                </button>
                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contactUser.email}&su=Connecting via the platform`} target="_blank" rel="noreferrer" className={g.btn} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <IconBrandGmail size={20} /> Gmail
                </a>
                <a href={`https://outlook.office.com/mail/deeplink/compose?to=${contactUser.email}&subject=Connecting via the platform`} target="_blank" rel="noreferrer" className={g.btn} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <IconBrandWindows size={20} /> Outlook
                </a>
                <a href={`https://compose.mail.yahoo.com/?to=${contactUser.email}&subject=Connecting via the platform`} target="_blank" rel="noreferrer" className={g.btn} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <IconBrandYahoo size={20} /> Yahoo Mail
                </a>
                <a href={`mailto:${contactUser.email}?subject=Connecting via the platform`} className={g.btn} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <IconMail size={20} /> Default Mail App
                </a>
              </div>
            </div>
          </div>
        )}
      </Suspense>
    </>
  );
}
