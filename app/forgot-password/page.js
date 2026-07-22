"use client";
import { useState } from "react";
import Link from "next/link";
import Logo3D from "@/components/Logo3D";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="iv-auth">
      <div className="iv-auth-aurora" />
      <div className="iv-auth-card">
        <div className="iv-logo-wrap center">
          <Logo3D size={42} />
          <span className="iv-logo-text">ASKCHO <span className="muted">Invest</span></span>
        </div>
        {!sent ? (
          <>
            <h1 className="iv-auth-title">Reset your password</h1>
            <p className="iv-auth-sub">Enter the email on your account and we'll send a reset link.</p>
            <form onSubmit={submit}>
              <label className="iv-field">
                <span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
              </label>
              <button type="submit" className="iv-btn-primary full">Send reset link</button>
            </form>
          </>
        ) : (
          <>
            <h1 className="iv-auth-title">Check your email</h1>
            <p className="iv-auth-sub">
              If an account exists for <span className="mono">{email || "that address"}</span>, a reset link is on its way.
            </p>
          </>
        )}
        <p className="iv-auth-switch">
          <Link href="/login" style={{ textDecoration: "underline", color: "var(--text)" }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
