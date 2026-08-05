"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Lock } from "lucide-react";
import { useStore } from "@/lib/store";

const AuthGateContext = createContext(null);

export function AuthGateProvider({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { state } = useStore();

  // Call requireAuth(fn) from any component. If the user is signed in, fn runs
  // immediately. If not, the login-required prompt opens and fn is skipped.
  function requireAuth(fn) {
    if (state.user) {
      fn && fn();
      return true;
    }
    setOpen(true);
    return false;
  }

  function close() {
    setOpen(false);
  }

  const value = { requireAuth, isGuest: !state.user };

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {open && (
        <div className="iv-modal-overlay" onClick={close}>
          <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
            <button className="iv-icon-btn" onClick={close} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, zIndex: 1 }}>
              <X size={16} />
            </button>
            <div className="iv-panel-head" style={{ marginBottom: 10, paddingRight: 44, flexWrap: "nowrap" }}>
              <h3>Log in required</h3>
              <Lock size={16} className="muted" style={{ flexShrink: 0 }} />
            </div>
            <p className="iv-sub" style={{ marginBottom: 22 }}>
              You'll need to log in or create a free account to use this feature.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="iv-btn-primary full"
                onClick={() => {
                  close();
                  router.push("/login");
                }}
              >
                Log in
              </button>
              <button
                className="iv-btn-ghost full"
                onClick={() => {
                  close();
                  router.push("/signup");
                }}
              >
                Create account
              </button>
              <button className="iv-btn-ghost full" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}
