import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconBrandGithub,
  IconExternalLink,
  IconArrowLeft,
  IconUsers,
  IconFileText,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import "@/models/User";
import { SkillGapAnalyzer } from "@/components/SkillGapAnalyzer";
import {
  CollaborationBadge,
  CollaborationLevel,
} from "@/components/CollaborationStatus";
import g from "../../grid.module.css";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

function isValidObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

async function getProjectReadme(repoLink?: string) {
  if (!repoLink || !repoLink.includes("github.com")) return null;

  try {
    const urlParts = repoLink.split("github.com/");
    if (urlParts.length <= 1) return null;

    const pathParts = urlParts[1].split("/").filter(Boolean);
    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1].replace(".git", "");

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "Project-Analyzer-App",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return null;
    return await res.text();
  } catch (error) {
    console.error("Failed to fetch README:", error);
    return null;
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  try {
    await dbConnect();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[projects/[id]] dbConnect failed", msg);
    return (
      <>
        <Navbar />
        <div className={g.container}>
          <div className={g.card} style={{ border: '1px solid var(--border)', marginTop: 40, padding: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-space)', marginBottom: 16 }}>Couldn’t load this project</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>The database is not reachable from the server right now.</p>
            {process.env.NODE_ENV !== "production" && (
              <pre style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginBottom: 24 }}>{msg}</pre>
            )}
            <Link href="/projects" className={g.btn} style={{ display: 'inline-flex' }}>Back to Projects</Link>
          </div>
        </div>
      </>
    );
  }

  let project: any = null;
  try {
    project = await Project.findById(id)
      .populate("teamMembers", "name collaborationStatus")
      .lean();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[projects/[id]] Failed to fetch project", msg);
    return (
      <>
        <Navbar />
        <div className={g.container}>
          <div className={g.card} style={{ border: '1px solid var(--border)', marginTop: 40, padding: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-space)', marginBottom: 16 }}>Couldn’t load this project</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Something went wrong while loading this project.</p>
            {process.env.NODE_ENV !== "production" && (
              <pre style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginBottom: 24 }}>{msg}</pre>
            )}
            <Link href="/projects" className={g.btn} style={{ display: 'inline-flex' }}>Back to Projects</Link>
          </div>
        </div>
      </>
    );
  }

  if (!project) notFound();

  const projectId = project._id.toString();
  const createdAt = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "";

  const readmeContent = await getProjectReadme(project.repoLink);

  const images: string[] = Array.isArray(project.images)
    ? project.images
        .map((s: unknown) => String(s || "").trim())
        .filter((s: string) => s && /^https?:\/\//i.test(s))
    : [];

  return (
    <>
      <Navbar />
      <div className={g.container}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/projects" className={g.btn} style={{ display: 'inline-flex', border: 'none' }}>
            <IconArrowLeft size={16} /> Back to Projects
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          <div style={{ gridColumn: '1 / -1', '@media (min-width: 768px)': { gridColumn: 'span 2' } } as any}>
            <div className={g.card} style={{ height: 'auto', border: '1px solid var(--border)' }}>
              <div className={g.cardBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '2rem', marginBottom: 12 }}>{project.title}</h1>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {project.isFeatured && <span className={g.badge} style={{ background: 'var(--accent)', color: '#fff' }}>Featured</span>}
                      <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>{createdAt}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {project.repoLink && (
                      <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className={g.btn}>
                        <IconBrandGithub size={18} /> Code
                      </a>
                    )}
                    {project.demoLink && (
                      <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className={`${g.btn} ${g.btnPrimary}`}>
                        <IconExternalLink size={18} /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className={g.tagList} style={{ marginBottom: 32 }}>
                  {project.techStack?.map((tech: string) => (
                    <span key={tech} className={g.tag} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                      {tech}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 32 }}>
                  {project.description}
                </div>

                {images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 32 }}>
                    {images.map((img: string, idx: number) => (
                      <div key={idx} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                        <img 
                          src={img} 
                          alt={`Project image ${idx + 1}`} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/1200x800?text=Image+Unavailable"; }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {readmeContent && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                      <div style={{ background: 'var(--accent)', color: '#fff', padding: 8, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconFileText size={20} />
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1.25rem', margin: 0 }}>README.md</h3>
                    </div>

                    <div style={{ background: 'var(--bg-2)', padding: 24, border: '1px solid var(--border)', overflowX: 'auto' }}>
                      <div className="markdown-body" style={{ color: 'var(--text)' }}>
                        <ReactMarkdown>{readmeContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SkillGapAnalyzer projectId={projectId} />

            <div className={g.card} style={{ height: 'auto', border: '1px solid var(--border)' }}>
              <div className={g.cardBody}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ background: 'var(--accent-2)', color: '#000', padding: 8, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconUsers size={20} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1.25rem', margin: 0 }}>Team Members</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    project.teamMembers.map((member: any) => (
                      <div key={member._id.toString()} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {member.name?.[0] || "?"}
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{member.name || "Unknown User"}</div>
                            {member.collaborationStatus?.visible && (
                              <CollaborationBadge level={member.collaborationStatus.level as CollaborationLevel} size="xs" />
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contributor</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>No members listed</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
