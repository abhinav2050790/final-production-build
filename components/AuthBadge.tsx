"use client";

// ── Google sign-in badge — top-right account chip / login button ──────────────

import { useEffect, useState } from "react";

interface SessionUser {
  email: string;
  name: string | null;
  picture: string | null;
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.3 5.3C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default function AuthBadge() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { user: SessionUser | null }) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoaded(true));

    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");
    if (authError) {
      setNotice(authError);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setNotice(null), 6000);
    }
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      // redirect: "manual" — the route answers with a 307 to Google; following
      // it inside fetch triggers a CORS failure before we can navigate.
      const res = await fetch("/api/auth/google", { redirect: "manual" });
      if (res.type === "opaqueredirect" || res.status === 0 || res.status === 307 || res.status === 302) {
        window.location.href = "/api/auth/google";
        return;
      }
      const d = await res.json().catch(() => ({ error: "Sign-in unavailable." }));
      setError(d.error ?? "Google sign-in is not configured yet.");
    } catch {
      setError("Could not start Google sign-in.");
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {notice && (
        <span className="glass-strong rounded-lg border-accent border px-3 py-1.5 font-mono text-[10px] text-accent">
          {notice}
        </span>
      )}
      {!loaded ? (
        <span className="h-[38px] w-[190px] animate-pulse rounded-lg bg-black/[0.04]" />
      ) : user ? (
        <div className="glass-strong flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black font-mono text-xs font-bold text-white">
              {(user.name ?? user.email)[0]?.toUpperCase()}
            </span>
          )}
          <span className="max-w-[140px] truncate text-xs font-medium text-black">
            {user.name ?? user.email}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="font-mono text-[10px] uppercase tracking-wider text-fog-faint transition hover:text-accent"
          >
            exit
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={signIn}
            className="flex items-center gap-2.5 rounded-lg border border-line-strong bg-black/[0.04] px-4 py-2.5 text-sm font-medium text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            <GoogleG />
            Sign in with Google
          </button>
          {error && (
            <span className="max-w-[280px] rounded-lg border-accent border bg-accent-subtle px-3 py-1.5 font-mono text-[10px] leading-relaxed text-accent">
              {error}
            </span>
          )}
        </>
      )}
    </div>
  );
}
