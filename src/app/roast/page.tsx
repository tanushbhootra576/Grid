"use client";

import { useState, useRef } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { Navbar } from "@/components/Navbar";
import { IconFlame, IconUpload, IconFileText, IconAlertTriangle, IconCheck, IconTarget, IconChartRadar, IconRefresh } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import { showError } from "@/lib/error-handling";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import g from "../grid.module.css";

interface RoastData {
  score?: number;
  metrics?: string[];
  roast?: string;
  fixes?: string[];
  skillsMap?: { subject: string; A: number; fullMark: number }[];
}

export default function RoastPage() {
  const [resumeText, setResumeText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        showError({ message: "Only PDF files are supported" }, "Invalid File");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError({ message: "File is too large. Max size is 5MB." }, "File Too Large");
        return;
      }
      setPdfFile(file);
      setResumeText("");
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleRoast = async () => {
    if (!resumeText.trim() && !pdfFile) return;
    setLoading(true);
    setLoadingText("Extracting text...");
    setRoastData(null);
    
    try {
      let pdfBase64 = undefined;
      if (pdfFile) {
        pdfBase64 = await getBase64(pdfFile);
      }

      // 1. Extract text using our lightweight API route
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, pdfBase64 }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract resume text");
      
      const finalResumeText = data.extractedText;

      // 2. Load WebLLM (Downloads Llama 3 directly into the browser Cache)
      setLoadingText("Initializing AI Engine (this may take a few minutes the first time)...");
      const engine = await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f32_1-MLC", {
        initProgressCallback: (info) => {
          setLoadingText(info.text);
        }
      });

      setLoadingText("Roasting your resume with WebAssembly...");

      const systemPrompt = `You are a ruthless, highly experienced Y Combinator partner and tech recruiter. 
A college student has just handed you their resume. Your job is to ROAST IT.
Do NOT sugarcoat anything. Be brutally honest.

You MUST respond ONLY with a valid JSON object with the following schema, and absolutely no other text, markdown, or backticks:
{
  "score": 65,
  "metrics": ["Red flag 1", "Red flag 2", "Red flag 3"],
  "roast": "Brutal markdown roast here...",
  "fixes": ["Fix 1", "Fix 2", "Fix 3"],
  "skillsMap": [
    { "subject": "Frontend", "A": 90, "fullMark": 100 }
  ]
}`;

      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the resume:\n${finalResumeText}` }
        ],
        response_format: { type: "json_object" }
      });
      
      let resultJson;
      try {
          resultJson = JSON.parse(response.choices[0].message.content || "{}");
      } catch (e) {
          resultJson = { roast: response.choices[0].message.content };
      }
      
      setRoastData(resultJson);
    } catch (error) {
      showError(error, "Roast Failed");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const scoreColor = roastData?.score && roastData.score >= 80 ? 'var(--accent)' : (roastData?.score && roastData.score >= 50 ? '#F59E0B' : 'red');

  return (
    <>
      <Navbar />
      <style jsx global>{`
        .markdown-verdict p {
          margin-bottom: 1em;
        }
        .markdown-verdict strong {
          color: var(--text);
          font-weight: 700;
        }
      `}</style>
      
      <div className={g.container} style={{ maxWidth: 1400, marginTop: 60, paddingBottom: 100 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'var(--accent)', color: '#000', borderRadius: '50%', marginBottom: 16 }}>
            <IconFlame size={32} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontSize: '3rem', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>
            Resume Roast
          </h1>
          <p style={{ fontFamily: 'var(--font-space)', color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: 16, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Upload your resume. Our AI acts as an expert tech recruiter to give you an ATS score, skills map, and constructive feedback.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
          gap: 24,
          alignItems: 'start'
        }}>
          
          {/* COLUMN 1: UPLOAD */}
          <div className={g.card} style={{ border: '2px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: 'var(--font-space)', marginTop: 0, marginBottom: 24, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={g.badge} style={{ background: 'var(--text)', color: 'var(--bg)', fontSize: '0.8rem', padding: '4px 8px' }}>01</span>
              Data Input
            </h3>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {!pdfFile ? (
                <>
                  <div 
                    style={{ 
                      border: '2px dashed var(--border)', 
                      padding: '40px 20px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      background: 'var(--bg-2)',
                      transition: 'border-color 0.2s ease',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconUpload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload PDF</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Max file size 5MB</div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="application/pdf" 
                      style={{ display: 'none' }} 
                    />
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>OR</div>

                  <textarea
                    className={g.input}
                    style={{ width: '100%', height: 120, resize: 'vertical' }}
                    placeholder="Paste your raw resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    disabled={loading}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'var(--accent)', padding: 12, color: '#000', display: 'flex' }}>
                      <IconFileText size={32} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{pdfFile.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <button 
                    className={g.btn} 
                    style={{ padding: 8, background: 'transparent', border: '1px solid var(--border)' }}
                    onClick={() => setPdfFile(null)}
                    disabled={loading}
                  >
                    <IconRefresh size={20} />
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 32 }}>
              <button 
                className={`${g.btn} ${g.btnPrimary}`} 
                onClick={handleRoast} 
                disabled={loading || (!resumeText.trim() && !pdfFile)}
                style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.05rem', background: 'var(--text)', color: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div>{loading ? "Analyzing..." : "Generate Roast (WebAssembly)"}</div>
                {loadingText && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>
                    {loadingText}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* COLUMN 2: METRICS & MAP */}
          <div className={g.card} style={{ border: '2px solid var(--border)', background: 'var(--bg-2)', height: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-space)', marginTop: 0, marginBottom: 24, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={g.badge} style={{ background: 'var(--text)', color: 'var(--bg)', fontSize: '0.8rem', padding: '4px 8px' }}>02</span>
              ATS Score & Spider Map
            </h3>
            
            {!roastData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)', opacity: 0.5 }}>
                <IconChartRadar size={64} style={{ marginBottom: 16 }} />
                Waiting for target...
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32, background: 'var(--bg)', border: '1px solid var(--border)', padding: '32px 24px' }}>
                  <div style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'var(--font-space)', color: scoreColor, lineHeight: 1 }}>
                    {roastData.score || '?'}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    Recruiter Pass Probability
                  </div>
                </div>

                {roastData.skillsMap && roastData.skillsMap.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>Skill Distribution</h4>
                    <div style={{ width: '100%', height: 280, background: 'var(--bg)', border: '1px solid var(--border)', paddingTop: 16 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={roastData.skillsMap}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Skills" dataKey="A" stroke={scoreColor} fill={scoreColor} fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* COLUMN 3: VERDICT */}
          <div className={g.card} style={{ border: roastData ? '2px solid var(--accent)' : '2px solid var(--border)', background: 'var(--bg)', height: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-space)', color: roastData ? 'var(--accent)' : 'var(--text)', marginTop: 0, marginBottom: 24, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={g.badge} style={{ background: roastData ? 'var(--accent)' : 'var(--text)', color: roastData ? '#000' : 'var(--bg)', fontSize: '0.8rem', padding: '4px 8px' }}>03</span>
              Analysis
            </h3>
            
            {!roastData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)', opacity: 0.5 }}>
                <IconFlame size={64} style={{ marginBottom: 16 }} />
                No roast generated yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {roastData.metrics && roastData.metrics.length > 0 && (
                  <div style={{ background: 'var(--bg-2)', border: '1px solid red', padding: 24 }}>
                    <h4 style={{ color: 'red', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconAlertTriangle size={18} /> Critical Flaws
                    </h4>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {roastData.metrics.map((metric, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.95rem' }}>
                          <span style={{ color: 'red', marginTop: 2 }}>•</span>
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>The Verdict</h4>
                  <div className="markdown-verdict" style={{ lineHeight: 1.7, fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                    <ReactMarkdown>{roastData.roast || ''}</ReactMarkdown>
                  </div>
                </div>

                {roastData.fixes && roastData.fixes.length > 0 && (
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: 32 }}>
                    <h4 style={{ fontFamily: 'var(--font-space)', fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconTarget size={20} color="var(--accent)" /> Action Plan
                    </h4>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {roastData.fixes.map((fix, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.95rem', background: 'var(--bg-2)', padding: 16, border: '1px solid var(--border)' }}>
                          <IconCheck size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
