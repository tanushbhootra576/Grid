'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { getAuthHeaders } from '@/lib/api';
import { showError } from '@/lib/error-handling';
import s from './login.module.css';

/* ── Grid logo mark (inline) ── */
function GridMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width={40} height={40} aria-hidden="true">
      <rect x="4" y="12" width="32" height="18" fill="var(--accent)" />
      <rect x="12" y="4" width="16" height="10" fill="var(--accent)" opacity={0.7} />
      <rect x="0" y="28" width="40" height="6" fill="var(--accent)" opacity={0.35} />
      <circle cx="34" cy="7" r="4" fill="var(--accent-2)" />
    </svg>
  );
}

/* ── Geometric background pattern ── */
function BgPattern() {
  return (
    <svg className={s.bgPattern} viewBox="0 0 800 600" fill="none" aria-hidden="true">
      {/* Grid lines */}
      {[100,200,300,400,500,600,700].map(x => (
        <line key={x} x1={x} y1={0} x2={x} y2={600} stroke="var(--border)" strokeWidth={0.8} />
      ))}
      {[100,200,300,400,500].map(y => (
        <line key={y} x1={0} y1={y} x2={800} y2={y} stroke="var(--border)" strokeWidth={0.8} />
      ))}
      {/* Bauhaus accent shapes */}
      <rect x={580} y={80} width={120} height={120} fill="var(--accent)" opacity={0.06} />
      <circle cx={660} cy={420} r={90} fill="var(--accent-2)" opacity={0.05} />
      <polygon points="100,480 200,300 300,480" fill="var(--accent)" opacity={0.05} />
      <rect x={60} y={60} width={60} height={60} fill="var(--accent-2)" opacity={0.07} />
    </svg>
  );
}

const GUIDELINES = [
  "Maintain professional conduct in all discussions and chats.",
  "No spam, hate speech, or inappropriate content.",
  "This platform is for academic and skill-building purposes only.",
  "Respect the privacy and work of other students.",
  "Your actions reflect on your professional campus reputation.",
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (!profile.acceptedGuidelines) {
        setPendingUid(user.uid);
        setGuidelinesOpen(true);
      } else {
        router.replace('/profile');
      }
    }
  }, [user, profile, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google');
    } catch (err: any) {
      showError({ message: 'Failed to initiate Google sign-in.' }, 'Login Failed');
      setLoading(false);
    }
  };

  const handleAcceptGuidelines = async () => {
    if (!pendingUid || !agreed) return;
    setLoading(true);
    try {
      await fetch(`/api/users/${pendingUid}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ acceptedGuidelines: true }),
      });
      await refreshProfile();
      setGuidelinesOpen(false);
      router.push('/profile');
    } catch {
      showError({ message: 'Failed to process. Please try again.' }, 'Guidelines');
      setLoading(false);
    }
  };

  /* ── Loading state ── */
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className={s.loadingWrap}>
          <div className="squareSpinner" />
          <span>Loading...</span>
        </div>
      </>
    );
  }

  /* ── Guidelines Modal ── */
  if (guidelinesOpen) {
    return (
      <>
        <Navbar />
        <div className={s.modalBackdrop}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <div className={s.modalAccent} />
              <h2 className={s.modalTitle}>Community Guidelines</h2>
              <p className={s.modalSub}>
                Grid is built on trust. Read and accept before continuing.
              </p>
            </div>
            <div className={s.guidelinesList}>
              {GUIDELINES.map((g, i) => (
                <div key={i} className={s.guidelineItem}>
                  <div className={s.guidelineDot}
                    style={{ background: i % 2 === 0 ? "var(--accent)" : "var(--accent-2)" }} />
                  <span>{g}</span>
                </div>
              ))}
            </div>
            <label className={s.checkRow}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.currentTarget.checked)}
                className={s.checkbox}
              />
              <span>I have read and agree to the Community Guidelines</span>
            </label>
            <button
              className={s.acceptBtn}
              onClick={handleAcceptGuidelines}
              disabled={!agreed || loading}
            >
              {loading ? <div className="squareSpinner small" /> : null}
              Accept & Continue
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Main login page ── */
  return (
    <>
      <Navbar />
      <div className={s.page}>
        <BgPattern />

        <div className={s.layout}>
          {/* Left: Brand panel */}
          <div className={s.brandPanel}>
            <div className={s.brandContent}>
              <div className={s.brandLogoRow}>
                <GridMark />
                <span className={s.brandName}>Grid</span>
              </div>

              <h1 className={s.brandHeadline}>
                Your campus.<br />
                Your skills.<br />
                <span className={s.brandAccent}>Your grid.</span>
              </h1>

              <p className={s.brandSub}>
                Join 1,200+ students trading skills, shipping projects,
                and building real campus networks.
              </p>

              {/* Social proof */}
              <div className={s.socialProof}>
                {[
                  { val: "1.2k+", label: "Students" },
                  { val: "90+",   label: "Projects" },
                  { val: "500+",  label: "Discussions" },
                ].map((s2, i) => (
                  <div key={i} className={s.proofItem}>
                    <span className={s.proofVal}>{s2.val}</span>
                    <span className={s.proofLabel}>{s2.label}</span>
                  </div>
                ))}
              </div>

              {/* Decorative Bauhaus shapes */}
              <div className={s.brandDecor} aria-hidden="true">
                <div style={{ width:56, height:56, background:"var(--accent)", opacity:0.8 }} />
                <div style={{ width:56, height:56, background:"var(--accent-2)", marginTop:10 }} />
                <div style={{ width:56, height:112, background:"var(--bg-3)", marginTop:10, border:"2px solid var(--border)" }} />
              </div>
            </div>
          </div>

          {/* Right: Login card */}
          <div className={s.formPanel}>
            <div className={s.card}>
              <div className={s.cardAccent} />

              <div className={s.cardHeader}>
                <h2 className={s.cardTitle}>Sign in to Grid</h2>
                <p className={s.cardSub}>
                  Use your college Google account. No password needed.
                </p>
              </div>

              <button
                className={s.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={loading}
                id="login-google-btn"
              >
                {loading ? (
                  <div className="squareSpinner small" />
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className={s.divider}>
                <div className={s.dividerLine} />
                <span className={s.dividerText}>or</span>
                <div className={s.dividerLine} />
              </div>

              <div className={s.emailNote}>
                <div className={s.emailNoteIcon}>
                  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <rect x="2" y="4" width="16" height="12" stroke="var(--accent)" strokeWidth="1.5"/>
                    <polyline points="2,4 10,11 18,4" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <span>
                  Sign in with your college Google account.
                  Supported: <strong>.edu</strong>, <strong>.ac.in</strong>, and all institutional emails.
                </span>
              </div>

              <p className={s.termsNote}>
                By signing in, you agree to our{" "}
                <a href="/terms" className={s.termsLink}>Terms</a>
                {" & "}
                <a href="/guidelines" className={s.termsLink}>Community Guidelines</a>.
              </p>
            </div>

            <p className={s.newUser}>
              New to Grid?{" "}
              <button className={s.newUserLink} onClick={handleGoogleSignIn}>
                Sign up free with Google
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
