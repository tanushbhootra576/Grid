'use client';

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  IconBrandGithub,
  IconExternalLink,
  IconPlus,
  IconStar,
  IconX,
  IconBrandGmail,
  IconBrandWindows,
  IconBrandYahoo,
  IconMail
} from "@tabler/icons-react";
import Link from "next/link";
import { showError } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";
import g from "../grid.module.css";

interface ProjectTeamMember {
  _id: string;
  firebaseUid?: string;
  name?: string;
  email?: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  demoLink?: string;
  repoLink?: string;
  images: string[];
  isFeatured: boolean;
  teamMembers?: ProjectTeamMember[];
}

export default function ProjectsPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [opened, setOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [contactOpened, setContactOpened] = useState(false);
  const [contactMember, setContactMember] = useState<ProjectTeamMember | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    techStack: "",
    demoLink: "",
    repoLink: "",
    imageUrl: "",
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to fetch projects");
        setProjects([]);
        return;
      }
      setProjects(data.projects || []);
    } catch (error) {
      showError("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!profile) {
      alert("Please complete your profile before submitting a project.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newProject,
          techStack: newProject.techStack
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
          images: newProject.imageUrl ? [newProject.imageUrl] : [],
          teamMembers: [profile._id],
        }),
      });

      if (res.ok) {
        setOpened(false);
        fetchProjects();
        setNewProject({
          title: "",
          description: "",
          techStack: "",
          demoLink: "",
          repoLink: "",
          imageUrl: "",
        });
      } else {
        const data = await res.json();
        showError({ message: data.error || data.detail || "Failed to submit project" }, "Submission Failed");
      }
    } catch (error) {
      showError(error, "Submission Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={g.container}>
        <div className={g.headerRow}>
          <h1 className={g.title}>
            <div className={g.titleAccent} />
            Campus Projects
          </h1>
          {user && (
            <button className={`${g.btn} ${g.btnPrimary}`} onClick={() => setOpened(true)}>
              <IconPlus size={18} /> SUBMIT PROJECT
            </button>
          )}
        </div>

        {loading ? (
          <div className="squareSpinner" />
        ) : (
          <div className={g.grid}>
            {projects.map((project) => (
              <div key={project._id} className={g.card}>
                <div className={g.cardTop} style={{ background: project.isFeatured ? 'var(--accent-2)' : 'var(--border)' }} />
                
                <img
                  src={
                    project.images?.[0]
                      ? project.images[0]
                      : project.demoLink
                      ? `/api/screenshot?url=${encodeURIComponent(project.demoLink)}`
                      : "https://placehold.co/600x400/18181b/ffffff?text=No+Preview"
                  }
                  alt={project.title}
                  style={{ height: 160, width: "100%", objectFit: "cover", display: "block", background: "#18181b", borderBottom: '1px solid var(--border)' }}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                      e.currentTarget.dataset.fallback = "1";
                      e.currentTarget.src = "https://placehold.co/600x400/18181b/ffffff?text=Preview+Unavailable";
                    }
                  }}
                />

                <div className={g.cardBody}>
                  <div className={g.cardHeader} style={{ marginBottom: 12 }}>
                    <h3 className={g.cardTitle} style={{ marginBottom: 0 }}>{project.title}</h3>
                    {project.isFeatured && (
                      <span className={`${g.badge} ${g.request}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconStar size={12} /> FEATURED
                      </span>
                    )}
                  </div>

                  <p className={g.cardDesc}>{project.description}</p>

                  {project.techStack?.length > 0 && (
                    <div className={g.tagList} style={{ marginBottom: 16 }}>
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className={g.tag}>{tech}</span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className={g.tag} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={g.cardFooter} style={{ flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link href={`/projects/${project._id}`} className={g.btn} style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem' }}>
                        DETAILS
                      </Link>
                      {project.demoLink && (
                        <a href={project.demoLink} target="_blank" rel="noreferrer" className={g.btn} style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem' }}>
                          <IconExternalLink size={14} /> DEMO
                        </a>
                      )}
                      {project.repoLink && !project.demoLink && (
                        <a href={project.repoLink} target="_blank" rel="noreferrer" className={g.btn} style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem' }}>
                          <IconBrandGithub size={14} /> CODE
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <div className={g.author}>
                        {project.teamMembers && project.teamMembers.length > 0 ? (
                          <>By <strong>{project.teamMembers[0].name}</strong> {project.teamMembers.length > 1 && `+${project.teamMembers.length - 1}`}</>
                        ) : 'No members'}
                      </div>
                      
                      {project.teamMembers && project.teamMembers.length > 0 && (
                        <button
                          className={g.btn}
                          style={{ padding: '4px 8px', fontSize: '0.7rem', border: 'none', textDecoration: 'underline' }}
                          onClick={() => {
                            setContactMember(project.teamMembers![0]);
                            setContactOpened(true);
                          }}
                        >
                          CONTACT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <div className={g.empty}>No projects found. Submit the first one!</div>
            )}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {opened && (
        <div className={g.modalBackdrop}>
          <div className={g.modal}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>Submit Project</h2>
              <button className={g.closeBtn} onClick={() => setOpened(false)}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody}>
              <div className={g.formGroup}>
                <label className={g.label}>Title</label>
                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} required />
              </div>
              <div className={g.formGroup}>
                <label className={g.label}>Tech Stack</label>
                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newProject.techStack} onChange={e => setNewProject({...newProject, techStack: e.target.value})} placeholder="React, Node.js, MongoDB" required />
              </div>
              <div className={g.formGroup}>
                <label className={g.label}>Repository Link</label>
                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newProject.repoLink} onChange={e => setNewProject({...newProject, repoLink: e.target.value})} placeholder="https://github.com/..." />
              </div>
              <div className={g.formGroup}>
                <label className={g.label}>Demo Link</label>
                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newProject.demoLink} onChange={e => setNewProject({...newProject, demoLink: e.target.value})} placeholder="https://..." />
              </div>
              <div className={g.formGroup}>
                <label className={g.label}>Image URL</label>
                <input className={g.input} style={{border: '1px solid var(--border)'}} value={newProject.imageUrl} onChange={e => setNewProject({...newProject, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className={g.formGroup}>
                <label className={g.label}>Description</label>
                <textarea className={`${g.input} ${g.textarea}`} style={{border: '1px solid var(--border)'}} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} required minLength={10} />
              </div>
              <button className={`${g.btn} ${g.btnPrimary}`} style={{marginTop: 10}} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'SUBMITTING...' : 'SUBMIT PROJECT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contactOpened && contactMember && (
        <div className={g.modalBackdrop}>
          <div className={g.modal}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>Contact {contactMember.name || 'Author'}</h2>
              <button className={g.closeBtn} onClick={() => setContactOpened(false)}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody}>
              {contactMember.email ? (
                <>
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contactMember.email}&su=Regarding your project`} target="_blank" rel="noreferrer" className={g.btn}>
                    <IconBrandGmail size={20} /> Gmail
                  </a>
                  <a href={`https://outlook.office.com/mail/deeplink/compose?to=${contactMember.email}&subject=Regarding your project`} target="_blank" rel="noreferrer" className={g.btn}>
                    <IconBrandWindows size={20} /> Outlook
                  </a>
                  <a href={`https://compose.mail.yahoo.com/?to=${contactMember.email}&subject=Regarding your project`} target="_blank" rel="noreferrer" className={g.btn}>
                    <IconBrandYahoo size={20} /> Yahoo Mail
                  </a>
                  <a href={`mailto:${contactMember.email}?subject=Regarding your project`} className={g.btn}>
                    <IconMail size={20} /> Default Mail App
                  </a>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Email not available for this author.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
