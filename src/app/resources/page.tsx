"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  IconSearch,
  IconFolder,
  IconFolderOpen,
  IconUpload,
  IconBrandGoogleDrive,
  IconFileText,
  IconBook,
  IconSchool,
  IconArrowRight,
  IconX
} from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import { showError, showSuccess } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";
import g from "../grid.module.css";

interface SubjectResource {
  _id: string;
  courseCode: string;
  courseName: string;
  year: number;
  branch: string;
  syllabus?: { linkUrl: string; description?: string };
  modules: { moduleNumber: number; title: string; linkUrl: string }[];
  pyqs: { exam: string; year: string; linkUrl: string }[];
  others: { title: string; linkUrl: string }[];
}

export default function ResourcesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const DRIVE_LINKS: Record<string, string> = {
    "1": "https://drive.google.com/drive/folders/YOUR_1ST_YEAR_FOLDER_ID",
    "2,3": "https://drive.google.com/drive/folders/YOUR_2ND_AND_3RD_YEAR_FOLDER_ID",
    "4": "https://drive.google.com/drive/folders/YOUR_4TH_YEAR_FOLDER_ID",
    all: "https://drive.google.com/drive/folders/YOUR_MAIN_FOLDER_ID",
  };

  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    courseCode: "",
    courseName: "",
    year: "1",
    branch: "",
    category: "NOTES",
    title: "",
    linkUrl: "",
    moduleNumber: 1,
    exam: "CAT1",
    examYear: new Date().getFullYear().toString(),
    description: "",
  });

  const handleUpload = async () => {
    if (!uploadForm.courseCode || !uploadForm.linkUrl || !uploadForm.title) {
      showError({ message: "Please fill all required fields" }, "Validation Error");
      return;
    }

    setUploading(true);
    try {
      const item: any = {
        linkUrl: uploadForm.linkUrl,
        title: uploadForm.title,
      };

      if (uploadForm.category === "NOTES") {
        item.moduleNumber = uploadForm.moduleNumber;
      } else if (uploadForm.category === "PYQ") {
        item.exam = uploadForm.exam;
        item.year = uploadForm.examYear;
      } else if (uploadForm.category === "SYLLABUS") {
        item.description = uploadForm.description;
      } else {
        item.description = uploadForm.description;
      }

      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: uploadForm.courseCode,
          courseName: uploadForm.courseName,
          year: parseInt(uploadForm.year),
          branch: uploadForm.branch,
          category: uploadForm.category,
          item,
          userId: profile?._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("Resource uploaded successfully! It is currently pending admin approval.");
        setUploadModalOpen(false);
        setUploadForm({
          courseCode: "", courseName: "", year: "1", branch: "", category: "NOTES",
          title: "", linkUrl: "", moduleNumber: 1, exam: "CAT1",
          examYear: new Date().getFullYear().toString(), description: "",
        });
        fetchResources(activeTab);
      } else {
        showError({ message: data.error || "Upload failed" }, "Error");
      }
    } catch (error) {
      showError(error, "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchResources(activeTab);
  }, [activeTab]);

  async function fetchResources(year: string) {
    setLoading(true);
    try {
      let url = "/api/resources";
      if (year && year !== "all") {
        url += `?year=${encodeURIComponent(year)}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.resources) {
        setResources(data.resources);
      } else {
        setResources([]);
      }
    } catch (error) {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.courseName.toLowerCase().includes(search.toLowerCase()) || r.courseCode.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    const y = r.year;
    if (y === undefined || y === null) return false;
    if (activeTab.includes(",")) {
      const years = activeTab.split(",").map(Number);
      return matchesSearch && years.includes(y);
    }
    return matchesSearch && String(y) === activeTab;
  });

  const handlePreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewOpened(true);
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: 'center', marginTop: 100 }}>
          <div className="squareSpinner" style={{ margin: 'auto' }} />
        </div>
      </>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: 'center', marginTop: 100 }}>
          <h2 style={{ fontFamily: 'var(--font-space)' }}>Resources</h2>
          <p style={{ color: 'var(--text-muted)' }}>Coming Soon</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={g.container} style={{ paddingTop: 40 }}>
        
        <div className={g.card} style={{ height: 'auto', border: '1px solid var(--border)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
          <IconFolderOpen style={{ position: 'absolute', right: -20, bottom: -20, width: 200, height: 200, opacity: 0.05, transform: 'rotate(-10deg)', color: 'var(--accent)' }} />
          <div className={g.cardBody} style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2rem', marginBottom: 16 }}>Resource Library</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: 600, fontSize: '1.1rem', lineHeight: 1.5 }}>
              Access a comprehensive collection of course materials, notes, and previous year questions. Organized by year and subject for easy access.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'All Resources' },
              { id: '1', label: '1st Year' },
              { id: '2,3', label: '2nd & 3rd Year' },
              { id: '4', label: '4th Year' }
            ].map(tab => (
              <button
                key={tab.id}
                className={g.btn}
                style={{ 
                  background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-2)', 
                  color: activeTab === tab.id ? '#fff' : 'var(--text)',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <IconSearch size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
              <input 
                className={g.input} 
                style={{ paddingLeft: 36, width: 250, border: '1px solid var(--border)' }} 
                placeholder="Search subjects..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <button className={`${g.btn} ${g.btnPrimary}`} onClick={() => setUploadModalOpen(true)}>
              <IconUpload size={16} /> Upload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="squareSpinner" style={{ margin: '100px auto' }} />
        ) : (
          <>
            {activeTab && DRIVE_LINKS[activeTab] && (
              <div className={g.card} style={{ height: 'auto', background: 'var(--accent-2)', color: '#000', marginBottom: 32, border: '1px solid var(--border)' }}>
                <div className={g.cardBody} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg)', color: 'var(--accent)', padding: 12, borderRadius: '50%' }}>
                      <IconBrandGoogleDrive size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Incomplete Materials?</div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        Access the full Google Drive folder for {activeTab === "all" ? "all years" : activeTab === "2,3" ? "2nd & 3rd Years" : `Year ${activeTab}`}.
                      </div>
                    </div>
                  </div>
                  <a href={DRIVE_LINKS[activeTab]} target="_blank" rel="noopener noreferrer" className={g.btn} style={{ background: '#fff', color: '#000', border: '1px solid var(--border)' }}>
                    <IconBrandGoogleDrive size={16} /> Open Drive Folder
                  </a>
                </div>
              </div>
            )}

            {filteredResources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                <IconFolder size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>No resources found matching your criteria.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {filteredResources.map((subject) => (
                  <div key={subject._id} className={g.card} style={{ height: 'auto', border: '1px solid var(--border)' }}>
                    <div className={g.cardBody}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <IconBook size={24} color="var(--accent)" />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{subject.courseName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subject.courseCode} • Year {subject.year}</div>
                          </div>
                        </div>
                        <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>
                          {(subject.syllabus ? 1 : 0) + subject.modules.length + subject.pyqs.length + subject.others.length} items
                        </span>
                      </div>

                      {/* Syllabus */}
                      {subject.syllabus && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <IconFileText size={16} /> Syllabus
                          </div>
                          <div className={g.grid} style={{ gap: 16 }}>
                            <ResourceItemCard title="Syllabus" type="SYLLABUS" onClick={() => handlePreview(subject.syllabus!.linkUrl, `${subject.courseName} Syllabus`)} />
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {subject.modules.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <IconSchool size={16} /> Notes
                          </div>
                          <div className={g.grid} style={{ gap: 16 }}>
                            {subject.modules.map((mod, idx) => (
                              <ResourceItemCard key={idx} title={`Module ${mod.moduleNumber}: ${mod.title}`} type="NOTES" onClick={() => handlePreview(mod.linkUrl, mod.title)} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PYQ */}
                      {subject.pyqs.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            <IconFolderOpen size={16} /> Previous Year Questions (PYQ)
                          </div>
                          <div className={g.grid} style={{ gap: 16 }}>
                            {subject.pyqs.map((pyq, idx) => (
                              <ResourceItemCard key={idx} title={`${pyq.exam} ${pyq.year}`} type="PYQ" onClick={() => handlePreview(pyq.linkUrl, `${pyq.exam} ${pyq.year}`)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {previewOpened && (
        <div className={g.modalBackdrop}>
          <div className={g.modal} style={{ maxWidth: 800, width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>{previewTitle}</h2>
              <button className={g.closeBtn} onClick={() => setPreviewOpened(false)}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
              <iframe
                src={getEmbedUrl(previewUrl)}
                style={{ width: "100%", flex: 1, border: "none", backgroundColor: "var(--bg-2)" }}
                title={previewTitle}
              />
              <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={g.btn}>
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadModalOpen && (
        <div className={g.modalBackdrop}>
          <div className={g.modal} style={{ maxWidth: 600 }}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>Upload Resource</h2>
              <button className={g.closeBtn} onClick={() => setUploadModalOpen(false)}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Course Code</label>
                    <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} placeholder="e.g. CSE1001" value={uploadForm.courseCode} onChange={e => setUploadForm({...uploadForm, courseCode: e.target.value.toUpperCase()})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Course Name</label>
                    <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} placeholder="e.g. Problem Solving" value={uploadForm.courseName} onChange={e => setUploadForm({...uploadForm, courseName: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Year</label>
                    <select className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} value={uploadForm.year} onChange={e => setUploadForm({...uploadForm, year: e.target.value})}>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Branch (Optional)</label>
                    <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} placeholder="e.g. CSE" value={uploadForm.branch} onChange={e => setUploadForm({...uploadForm, branch: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Category</label>
                  <select className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} value={uploadForm.category} onChange={e => setUploadForm({...uploadForm, category: e.target.value})}>
                    <option value="NOTES">NOTES</option>
                    <option value="PYQ">PYQ</option>
                    <option value="SYLLABUS">SYLLABUS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Title</label>
                  <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} placeholder="Resource Title" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Link URL</label>
                  <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} placeholder="Google Drive / YouTube Link" value={uploadForm.linkUrl} onChange={e => setUploadForm({...uploadForm, linkUrl: e.target.value})} />
                </div>

                {uploadForm.category === "NOTES" && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Module Number</label>
                    <input type="number" min="1" className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} value={uploadForm.moduleNumber} onChange={e => setUploadForm({...uploadForm, moduleNumber: Number(e.target.value)})} />
                  </div>
                )}

                {uploadForm.category === "PYQ" && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Exam</label>
                      <select className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} value={uploadForm.exam} onChange={e => setUploadForm({...uploadForm, exam: e.target.value})}>
                        <option value="CAT1">CAT1</option>
                        <option value="CAT2">CAT2</option>
                        <option value="FAT">FAT</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Exam Year</label>
                      <input className={g.input} style={{ width: '100%', border: '1px solid var(--border)' }} value={uploadForm.examYear} onChange={e => setUploadForm({...uploadForm, examYear: e.target.value})} />
                    </div>
                  </div>
                )}

                {(uploadForm.category === "SYLLABUS" || uploadForm.category === "OTHER") && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Description</label>
                    <textarea className={g.input} style={{ width: '100%', border: '1px solid var(--border)', minHeight: 100, padding: 12 }} placeholder="Optional description" value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} />
                  </div>
                )}

                <button className={`${g.btn} ${g.btnPrimary}`} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  if (url.includes("youtube.com/watch")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/");
  }
  return url;
}

function ResourceItemCard({ title, type, onClick }: { title: string; type: string; onClick: () => void; }) {
  const isPyq = type === "PYQ";
  const isSyllabus = type === "SYLLABUS";

  return (
    <div 
      className={g.card} 
      style={{ 
        height: 'auto', 
        border: '1px solid var(--border)', 
        padding: 16, 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }} 
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ 
          background: isPyq ? 'var(--accent)' : isSyllabus ? 'var(--accent-2)' : 'var(--bg-3)', 
          color: isPyq ? '#fff' : '#000',
          padding: 8, 
          borderRadius: 4, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {isPyq ? <IconFolderOpen size={20} /> : isSyllabus ? <IconFileText size={20} /> : <IconBook size={20} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {title}
          </div>
          <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)', fontSize: '0.7rem' }}>
            {type}
          </span>
        </div>

        <IconArrowRight size={16} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
      </div>
    </div>
  );
}
