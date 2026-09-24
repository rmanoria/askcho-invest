"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { loginWithPassword, loginWithGoogle } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function completeLogin(user, idToken) {
    login(
      {
        name: user.displayName || (user.email ? user.email.split("@")[0] : "Investor"),
        email: user.email,
        id: user.uid,
      },
      { access_token: idToken }
    );
    router.replace("/dashboard");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { user, idToken } = await loginWithPassword(email.trim().toLowerCase(), password);
      completeLogin(user, idToken);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleSubmitting(true);
    try {
      const { user, idToken } = await loginWithGoogle();
      completeLogin(user, idToken);
    } catch (err) {
      setError(err.message || "Unable to sign in with Google.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="iv-auth">
      <div className="iv-auth-aurora" />
      <div className="iv-auth-card">
        <div className="iv-logo-wrap center">
          <Logo size={42} textSize={22} />
        </div>
        <div className="iv-eyebrow center">NGX &middot; NYSE &middot; NASDAQ &middot; ETFs</div>
        <h1 className="iv-auth-title">Welcome back</h1>
        <p className="iv-auth-sub">Sign in to track markets, news, and your watchlist.</p>

        <button
          type="button"
          className="iv-btn-google full"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting || submitting}
        >
          <span className="iv-google-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
          </svg></span>
          {googleSubmitting ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="iv-divider" style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px", color: "var(--text-muted, #888)", fontSize: 13 }}>
          <span style={{ flex: 1, height: 1, background: "var(--border, #333)" }} />
          or
          <span style={{ flex: 1, height: 1, background: "var(--border, #333)" }} />
        </div>

        <form onSubmit={submit}>
          {error && <p className="iv-empty-sm" style={{ margin: "0 0 12px", }}>{error}</p>}
          <label className="iv-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          <label className="iv-field">
            <span>Password</span>
            <span className="iv-password-field">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
              <button type="button" className="iv-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <div className="iv-forgot-row">
            <Link href="/forgot-password" className="iv-link-btn">Forgot password?</Link>
          </div>

          <button type="submit" className="iv-btn-primary full" disabled={submitting || googleSubmitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="iv-auth-switch">
          New here? <Link href="/signup" className="iv-link-btn" style={{ textDecoration: "underline", color: "var(--text)" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}