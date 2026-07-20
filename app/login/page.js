"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Logo3D from "@/components/Logo3D";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e) {
    e.preventDefault();
    login({ name: email.split("@")[0] || "Investor", email: email || "demo@askcho.ai" });
    router.replace("/dashboard");
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
          <Logo3D size={32} />
          <span className="iv-logo-text">ASKCHO <span className="muted">Invest</span></span>
        </div>
        <div className="iv-eyebrow center">NGX &middot; NYSE &middot; NASDAQ &middot; ETFs</div>
        <h1 className="iv-auth-title">Welcome back</h1>
        <p className="iv-auth-sub">Sign in to track your portfolio and markets.</p>
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
          <button type="submit" className="iv-btn-primary full">Sign in</button>
        </form>
        <button className="iv-btn-ghost full" onClick={continueDemo}>Continue as demo user</button>
        <p className="iv-auth-switch">
          New here? <Link href="/signup" className="iv-link-btn" style={{ textDecoration: "underline", color: "var(--text)" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
