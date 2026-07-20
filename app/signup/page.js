"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Logo3D from "@/components/Logo3D";

export default function SignupPage() {
  const { login } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e) {
    e.preventDefault();
    login({ name: name || (email.split("@")[0] || "Investor"), email: email || "demo@askcho.ai" });
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
        <h1 className="iv-auth-title">Create your account</h1>
        <p className="iv-auth-sub">Start investing across Nigerian and US markets.</p>
        <form onSubmit={submit}>
          <label className="iv-field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Okafor" required />
          </label>
          <label className="iv-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </label>
          <label className="iv-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
          </label>
          <button type="submit" className="iv-btn-primary full">Create account</button>
        </form>
        <p className="iv-auth-switch">
          Already have an account? <Link href="/login" style={{ textDecoration: "underline", color: "var(--text)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
