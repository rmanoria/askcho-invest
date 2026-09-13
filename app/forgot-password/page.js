"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to send password reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="iv-auth">
      <div className="iv-auth-aurora" />
      <div className="iv-auth-card">
        <div className="iv-logo-wrap center">
          <Logo size={42} textSize={22} />
        </div>
        {!sent ? (
          <>
            <h1 className="iv-auth-title">Reset your password</h1>
            <p className="iv-auth-sub">Enter the email on your account and we&apos;ll send a reset link.</p>
            <form onSubmit={submit}>
              <label className="iv-field">
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" required />
              </label>
              {error && <p className="iv-empty-sm" style={{ margin: "0 0 12px" }}>{error}</p>}
              <button type="submit" className="iv-btn-primary full" disabled={submitting}>{submitting ? "Sending..." : "Send reset link"}</button>
            </form>
          </>
        ) : (
          <>
            <h1 className="iv-auth-title">Check your email</h1>
            <p className="iv-auth-sub">If an account exists for <span className="mono">{email}</span>, a reset link is on its way.</p>
          </>
        )}
        <p className="iv-auth-switch">
          <Link href="/login" style={{ textDecoration: "underline", color: "var(--text)" }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}