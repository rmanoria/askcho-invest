"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { loginWithPassword } from "@/lib/api";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = await loginWithPassword(email.trim().toLowerCase(), password);
      const userData = payload?.user || payload?.data?.user || null;
      const session = payload?.session || payload?.data?.session || null;
      const resolvedName = userData?.user_metadata?.full_name || userData?.name || (email.split("@")[0] || "Investor");
      login({
        name: resolvedName,
        email: userData?.email || email.trim().toLowerCase(),
        id: userData?.id || null
      }, session);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  function continueDemo() {
    login({ name: "Demo Investor", email: "demo@askcho.ai" });
    router.replace("/dashboard");
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
        <form onSubmit={submit}>
          <label className="iv-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          <label className="iv-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
          </label>
          <div className="iv-forgot-row">
            <Link href="/forgot-password" className="iv-link-btn">Forgot password?</Link>
          </div>
          {error && <p className="iv-empty-sm" style={{ margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" className="iv-btn-primary full" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
        </form>
        <button className="iv-btn-ghost full" onClick={continueDemo}>Continue as demo user</button>
        <p className="iv-auth-switch">
          New here? <Link href="/signup" className="iv-link-btn" style={{ textDecoration: "underline", color: "var(--text)" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}