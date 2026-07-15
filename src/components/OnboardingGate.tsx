"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { INDIAN_COLLEGES, findCollege } from "@/data/colleges";
import { getAuthHeaders } from "@/lib/api";
import { showError, showSuccess } from "@/lib/error-handling";
import {
  IconUser, IconBuildingCommunity,
  IconCalendar, IconCheck, IconChevronRight, IconChevronLeft,
  IconBrandLinkedin, IconBrandGithub, IconShieldCheck, IconShieldX,
  IconUpload, IconLock, IconAlertTriangle,
} from "@tabler/icons-react";
import g from "@/app/grid.module.css";

/**
 * Routes where we never show the onboarding overlay.
 * Login handles its own guidelines-acceptance flow.
 */
const SKIP_ROUTES = ["/login", "/signup", "/", "/guidelines", "/privacy", "/terms"];

const BRANCHES = [
  "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CPS", "AIML",
  "Ai-R", "BDS", "BPS", "CHEMICAL", "FASHION", "MBA", "MCA", "Other",
];
const YEARS = [1, 2, 3, 4, 5];

interface StepProps { formData: any; setFormData: (d: any) => void; }

// ── Step 1: Name ──────────────────────────────────────────────────────────────
function Step1({ formData, setFormData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64, background: "var(--accent)", color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <IconUser size={32} />
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", margin: 0 }}>
          What's your name?
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          This is how others will see you on Grid.
        </p>
      </div>
      <div className={g.formGroup}>
        <label className={g.label}>Full Name *</label>
        <input
          className={g.input}
          style={{ border: "1px solid var(--border)", fontSize: "1.1rem" }}
          placeholder="e.g. Tanush Bhootra"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          autoFocus
        />
      </div>
    </div>
  );
}

// ── Step 2: College ───────────────────────────────────────────────────────────
function Step2({ formData, setFormData }: StepProps) {
  const [search, setSearch] = useState(formData.college || "");
  const [open, setOpen] = useState(false);

  const filtered = search.length > 1
    ? INDIAN_COLLEGES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  const selectCollege = (name: string) => {
    const college = findCollege(name);
    setFormData({ ...formData, college: name, city: college?.city || "", state: college?.state || "" });
    setSearch(name);
    setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64, background: "var(--accent)", color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <IconBuildingCommunity size={32} />
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", margin: 0 }}>
          Which college?
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          Search from all Indian colleges. Creates your college community.
        </p>
      </div>
      <div className={g.formGroup} style={{ position: "relative" }}>
        <label className={g.label}>College Name *</label>
        <input
          className={g.input}
          style={{ border: "1px solid var(--border)" }}
          placeholder="Search: IIT Bombay, VIT, BITS..."
          value={search}
          onChange={e => { setSearch(e.target.value); setFormData({ ...formData, college: "" }); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoFocus
        />
        {open && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "var(--bg)", border: "1px solid var(--border)",
            zIndex: 100, maxHeight: 260, overflowY: "auto",
          }}>
            {filtered.map(c => (
              <button
                key={c.name}
                style={{
                  display: "flex", flexDirection: "column", width: "100%",
                  padding: "12px 16px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left", borderBottom: "1px solid var(--border)",
                }}
                onMouseDown={() => selectCollege(c.name)}
              >
                <div style={{ fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-space)", fontSize: "0.95rem" }}>{c.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-space)" }}>
                  {c.city}, {c.state} · {c.type}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {formData.college && (
        <div style={{ display: "flex", gap: 12 }}>
          <div className={g.formGroup} style={{ flex: 1 }}>
            <label className={g.label}>City</label>
            <input
              className={g.input}
              style={{ border: "1px solid var(--border)" }}
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className={g.formGroup} style={{ flex: 1 }}>
            <label className={g.label}>State</label>
            <input
              className={g.input}
              style={{ border: "1px solid var(--border)" }}
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Branch & Year ─────────────────────────────────────────────────────
function Step3({ formData, setFormData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64, background: "var(--accent)", color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <IconCalendar size={32} />
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", margin: 0 }}>
          Branch & Year
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          These will be locked after setup. Choose carefully.
        </p>
      </div>
      <div className={g.formGroup}>
        <label className={g.label}>Branch / Department *</label>
        <select
          className={g.select}
          style={{ border: "1px solid var(--border)", width: "100%", padding: 12, fontSize: "1rem" }}
          value={formData.branch}
          onChange={e => setFormData({ ...formData, branch: e.target.value })}
        >
          <option value="">Select Branch</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className={g.formGroup}>
        <label className={g.label}>Current Year *</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setFormData({ ...formData, year: y })}
              style={{
                padding: "16px 8px",
                border: formData.year === y ? "2px solid var(--text)" : "2px solid var(--border)",
                background: formData.year === y ? "var(--text)" : "var(--bg-2)",
                color: formData.year === y ? "var(--bg)" : "var(--text)",
                fontFamily: "var(--font-space)", fontSize: "1.1rem", fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Links ─────────────────────────────────────────────────────────────
function Step4({ formData, setFormData }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64, background: "var(--accent)", color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <IconBrandLinkedin size={32} />
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", margin: 0 }}>
          Social Links
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          Optional — but helps others connect with you.
        </p>
      </div>
      {[
        { icon: <IconBrandLinkedin size={18} />, label: "LinkedIn URL", key: "linkedin" as const, placeholder: "https://linkedin.com/in/..." },
        { icon: <IconBrandGithub size={18} />, label: "GitHub URL", key: "github" as const, placeholder: "https://github.com/..." },
      ].map(({ icon, label, key, placeholder }) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", padding: "0 16px" }}
        >
          <span style={{ color: "var(--text-muted)" }}>{icon}</span>
          <input
            style={{
              border: "none", background: "transparent", flex: 1,
              padding: "12px 0", color: "var(--text)", outline: "none",
              fontFamily: "var(--font-inter)",
            }}
            placeholder={placeholder}
            value={formData[key] || ""}
            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

// ── Step 5: ID Verification ───────────────────────────────────────────────────
interface Step5Props extends StepProps {
  verifyState: "idle" | "loading" | "success" | "fail" | "duplicate";
  verifyReason: string;
  onVerify: (file: File) => void;
}

function Step5({ formData, verifyState, verifyReason, onVerify }: Step5Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onVerify(e.target.files[0]);
  };

  const isDuplicate = verifyState === "duplicate";
  const isFail = verifyState === "fail" || isDuplicate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          width: 64, height: 64,
          background: verifyState === "success" ? "#22c55e" : isDuplicate ? "#f97316" : "var(--accent)",
          color: verifyState === "success" || isDuplicate ? "#fff" : "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", transition: "background 0.3s",
        }}>
          {isDuplicate ? <IconLock size={32} /> : <IconShieldCheck size={32} />}
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontSize: "1.5rem", margin: 0 }}>
          Student ID Verification
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          Upload your college ID card. Unlocks <strong>Chat</strong> and <strong>PoW Endorsements</strong>.
        </p>
      </div>

      {verifyState === "success" ? (
        <div style={{ padding: 24, border: "2px solid #22c55e", textAlign: "center", background: "rgba(34,197,94,0.05)" }}>
          <IconShieldCheck size={40} color="#22c55e" style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: "var(--font-space)", fontWeight: 700, color: "#22c55e", fontSize: "1.1rem" }}>
            Verified!
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>{verifyReason}</div>
        </div>
      ) : isDuplicate ? (
        <div style={{ padding: 20, border: "2px solid #f97316", background: "rgba(249,115,22,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <IconAlertTriangle size={20} color="#f97316" />
            <strong style={{ color: "#f97316" }}>Duplicate Account Detected</strong>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{verifyReason}</div>
          <div style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Contact support if you believe this is an error.
          </div>
        </div>
      ) : isFail ? (
        <div>
          <div style={{ padding: 20, border: "2px solid #ef4444", background: "rgba(239,68,68,0.05)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconShieldX size={20} color="#ef4444" />
              <strong style={{ color: "#ef4444" }}>Verification Failed</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{verifyReason}</div>
          </div>
          <button className={g.btn} style={{ width: "100%", justifyContent: "center" }} onClick={() => fileRef.current?.click()}>
            <IconUpload size={16} /> Try Again
          </button>
          <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleChange} />
        </div>
      ) : verifyState === "loading" ? (
        <div style={{ padding: 40, border: "2px dashed var(--border)", textAlign: "center", background: "var(--bg-2)" }}>
          <IconShieldCheck size={40} style={{ color: "var(--text-muted)", marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontFamily: "var(--font-space)", fontWeight: 600 }}>AI is scanning your ID...</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>Usually takes 5–10 seconds</div>
        </div>
      ) : (
        <div
          style={{
            border: "2px dashed var(--border)", padding: "40px 24px", textAlign: "center",
            cursor: "pointer", background: "var(--bg-2)", transition: "border-color 0.2s",
          }}
          onClick={() => fileRef.current?.click()}
          onMouseOver={e => (e.currentTarget.style.borderColor = "var(--text)")}
          onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <IconUpload size={40} style={{ color: "var(--text-muted)", marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontFamily: "var(--font-space)", fontWeight: 600, fontSize: "1.05rem" }}>Upload ID Card Photo</div>
          <div style={{ color: "var(--text-muted)", marginTop: 6, fontSize: "0.85rem" }}>JPG, PNG or WebP · Max 5MB</div>
          <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleChange} />
        </div>
      )}

      <div style={{ fontFamily: "var(--font-space)", fontSize: "0.85rem", color: "var(--text-muted)", padding: "12px 16px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        💡 <strong>Tip:</strong> Your name on Grid is <strong>{formData.name}</strong>. Make sure your ID shows the same name.
      </div>
    </div>
  );
}

// ── Steps config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Name",    required: (d: any) => !!d.name?.trim() },
  { id: 2, label: "College", required: (d: any) => !!d.college },
  { id: 3, label: "Year",    required: (d: any) => !!d.year },
  { id: 4, label: "Links",   required: () => true },
  { id: 5, label: "Verify",  required: () => true },
];

// ── Main Gate ─────────────────────────────────────────────────────────────────
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", college: "", city: "", state: "", year: 0,
    linkedin: "", github: "",
  });

  // Verification step state
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "fail" | "duplicate">("idle");
  const [verifyReason, setVerifyReason] = useState("");

  /**
   * Whether the current user's profile is "complete" for the purposes of
   * unblocking the app. Must match isProfileComplete() in AuthProvider.
   */
  const isComplete = !!(
    profile?.name?.trim() &&
    (profile as any)?.college?.trim() &&
    profile?.year &&
    profile?.acceptedGuidelines &&
    profile?.verified
  );

  useEffect(() => {
    if (!user || !profile) return;
    if (SKIP_ROUTES.includes(pathname)) return;
    // Don't interfere with the login/guidelines flow
    if (!profile.acceptedGuidelines) return;

    if (!isComplete) {
      // Pre-populate form with whatever the user already has
      const p = profile as any;
      setFormData({
        name: profile.name || user.displayName || "",
        college: p.college || "",
        city: p.city || "",
        state: p.state || "",
        year: profile.year || 0,
        linkedin: profile.socialLinks?.linkedin || "",
        github: profile.socialLinks?.github || "",
      });
      if (profile.verified) {
        setVerifyState("success");
        setVerifyReason("You're already verified from your profile!");
      }
      setShowModal(true);
    } else {
      // Profile is now complete — hide the modal
      setShowModal(false);
    }
  // Re-evaluate when profile data or pathname changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile?.name, (profile as any)?.college, profile?.year, profile?.acceptedGuidelines, profile?.verified, pathname]);

  const canContinue = STEPS[step - 1]?.required(formData) ?? true;

  // Save profile data (steps 1–4) then move to step 5
  const saveAndContinueToVerify = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          college: formData.college,
          city: formData.city,
          state: formData.state,
          year: formData.year,
          socialLinks: { linkedin: formData.linkedin, github: formData.github },
        }),
      });
      if (res.ok) {
        await refreshProfile();
        setStep(5); // move to verification
      } else {
        const d = await res.json();
        showError({ message: d.error || "Failed to save" }, "Error");
      }
    } catch (e) {
      showError(e, "Error");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Final "Finish" — called from step 5.
   * We save profileCompletedAt so the system knows onboarding is done.
   * The modal will close only because isComplete will become true once
   * the profile is refreshed.
   */
  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Mark profile as completed
      await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ profileCompletedAt: new Date().toISOString() }),
      });
      await refreshProfile();
      showSuccess("Welcome to Grid! 🎉");
      // Modal will close automatically because isComplete will be true after refresh
    } catch (e) {
      showError(e, "Error");
    } finally {
      setSaving(false);
    }
  };

  // ID verification handler
  const handleVerify = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showError({ message: "Image too large (Max 5MB)" }, "Error");
      return;
    }
    setVerifyState("loading");
    
    // Resize image on the client to make OCR extremely fast
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const MAX_DIM = 800; // Shrink to 800px max for fast OCR

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round(height * (MAX_DIM / width));
          width = MAX_DIM;
        } else {
          width = Math.round(width * (MAX_DIM / height));
          height = MAX_DIM;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Compress to 80% JPEG quality
      const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

      try {
        const res = await fetch("/api/verify-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idImageBase64: base64 }),
        });
        const data = await res.json();
        
        if (data.duplicateAccount) {
          setVerifyState("duplicate");
          setVerifyReason(
            data.data?.reason ||
            "This student ID is already linked to another Grid account. Multiple accounts are not permitted."
          );
        } else if (data.success) {
          setVerifyState("success");
          setVerifyReason(`Confirmed: ${data.data?.extractedName || "name matched"}`);
          refreshProfile();
        } else {
          setVerifyState("fail");
          setVerifyReason(
            data.data?.reason ||
            "Could not confirm this is a valid student ID matching your profile."
          );
        }
      } catch {
        setVerifyState("fail");
        setVerifyReason("Server error. Please try again.");
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setVerifyState("fail");
      setVerifyReason("Invalid image file.");
    };
    
    img.src = url;
  };

  return (
    <>
      {children}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 24, backdropFilter: "blur(8px)",
          }}
          // Prevent closing on backdrop click — this is intentionally blocking
        >
          <div
            style={{
              background: "var(--bg)", width: "100%", maxWidth: 520,
              border: "2px solid var(--border)", padding: 40,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Required badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 24, padding: "8px 14px",
              background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.18)",
              fontSize: "0.8rem", color: "var(--accent)", fontFamily: "var(--font-space)"
            }}>
              <IconLock size={14} />
              <span>Complete your profile to continue using Grid</span>
            </div>

            {/* Progress stepper */}
            <div style={{ display: "flex", gap: 0, justifyContent: "center", marginBottom: 40, alignItems: "center" }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 32, height: 32,
                    background: step > s.id ? "#22c55e" : step === s.id ? "var(--text)" : "var(--border)",
                    color: step >= s.id ? "var(--bg)" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                    transition: "background 0.2s",
                  }}>
                    {step > s.id ? <IconCheck size={16} /> : s.id}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: 24, height: 2,
                      background: step > s.id ? "#22c55e" : "var(--border)",
                      transition: "background 0.2s",
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div style={{ minHeight: 300 }}>
              {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
              {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className={g.label}>Year of Study</label>
                    <select
                      className={g.input}
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    >
                      <option value={0} disabled>Select Year</option>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                      <option value={5}>5th Year / Super Senior</option>
                    </select>
                  </div>
                </div>
              )}
              {step === 4 && <Step4 formData={formData} setFormData={setFormData} />}
              {step === 5 && (
                <Step5
                  formData={formData}
                  setFormData={setFormData}
                  verifyState={verifyState}
                  verifyReason={verifyReason}
                  onVerify={handleVerify}
                />
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, gap: 12 }}>
              {step > 1 && step < 5 ? (
                <button className={g.btn} onClick={() => setStep(s => s - 1)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <IconChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {/* Steps 1–3: Continue (required fields must be filled) */}
              {step < 4 && (
                <button
                  className={`${g.btn} ${g.btnPrimary}`}
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canContinue}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--text)", color: "var(--bg)",
                    opacity: canContinue ? 1 : 0.4,
                  }}
                >
                  Continue <IconChevronRight size={16} />
                </button>
              )}

              {/* Step 4: Save + go to verification */}
              {step === 4 && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className={g.btn}
                    onClick={saveAndContinueToVerify}
                    disabled={saving}
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                  >
                    {saving ? "Saving..." : "Skip links"}
                  </button>
                  <button
                    className={`${g.btn} ${g.btnPrimary}`}
                    onClick={saveAndContinueToVerify}
                    disabled={saving}
                    style={{ background: "var(--text)", color: "var(--bg)", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <IconCheck size={16} /> {saving ? "Saving..." : "Save & Continue"}
                  </button>
                </div>
              )}

              {/* Step 5: Finish (verify required) */}
              {step === 5 && (
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Show "All done" button only when verified */}
                  {verifyState !== "duplicate" && (
                    <button
                      className={`${g.btn} ${g.btnPrimary}`}
                      onClick={handleComplete}
                      disabled={saving || verifyState !== "success"}
                      style={{
                        background: verifyState === "success" ? "#22c55e" : "var(--text)",
                        color: "var(--bg)", display: "flex", alignItems: "center", gap: 6,
                        opacity: verifyState === "success" ? 1 : 0.4
                      }}
                    >
                      <IconCheck size={16} />
                      {saving ? "Finishing..." : verifyState === "success" ? "All done! →" : "Verify ID to Finish"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Step {step} of {STEPS.length}
              {step === 5 && " — ID verification is required to use Grid"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
