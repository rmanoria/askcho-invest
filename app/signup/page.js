"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { createAccount, loginWithPassword } from "@/lib/api";
import Logo from "@/components/Logo";

export default function SignupPage() {
  const { login } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const trimmedName = name.trim();
      const [firstName, ...rest] = trimmedName ? trimmedName.split(/\s+/) : ["Investor"];
      const lastName = rest.join(" ") || "User";

      await createAccount({
        first_name: firstName,
        last_name: lastName,
        email: email.trim().toLowerCase(),
        password
      });

      const payload = await loginWithPassword(email.trim().toLowerCase(), password);
      const userData = payload?.user || payload?.data?.user || null;
      const session = payload?.session || payload?.data?.session || null;

      login({
        name: trimmedName || (userData?.user_metadata?.full_name || "Investor"),
        email: userData?.email || email.trim().toLowerCase(),
        id: userData?.id || null
      }, session);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create account.");
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
          {error && <p className="iv-empty-sm" style={{ margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" className="iv-btn-primary full" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
        </form>
        <p className="iv-auth-switch">
          Already have an account? <Link href="/login" style={{ textDecoration: "underline", color: "var(--text)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}