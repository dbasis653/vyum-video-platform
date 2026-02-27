"use client";

/**
 * app/onboarding/page.tsx
 *
 * Shown once — right after a user signs up for the first time.
 * middleware.ts redirects here whenever a user's Clerk publicMetadata does NOT
 * have onboardingComplete: true (i.e., they haven't picked a username yet).
 *
 * Flow:
 *   1. User types their desired username
 *   2. On submit → PATCH /api/user/onboarding { username }
 *   3. The API saves username to DB and sets Clerk's publicMetadata.onboardingComplete
 *   4. router.push("/home") — middleware now lets them through
 *
 * Lives outside (app) layout intentionally — no sidebar/navbar during onboarding.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // React 19 deprecated React.FormEvent — React.SyntheticEvent is the replacement
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Middleware now falls back to the Clerk backend API when sessionClaims
      // are stale, so no client-side token refresh is needed here.
      router.replace("/home");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const trimmed = username.trim();
  const charCount = trimmed.length;
  const isValid = charCount >= 3 && charCount <= 20;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0e1a0b" }}
    >
      {/* Radial glow behind the card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 mb-10">
        <span className="text-2xl">🌿</span>
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "#4ade80" }}
        >
          VYUM
        </span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          background: "#192512",
          border: "1px solid rgba(74,222,128,0.12)",
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: "rgba(74,222,128,0.1)" }}
          >
            <span className="text-xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome aboard!</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(187,240,166,0.5)" }}>
            One last step — pick a username so others can find you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="text-sm font-medium"
              style={{ color: "#7ba86a" }}
            >
              Username
            </label>

            <div className="relative">
              {/* @ prefix */}
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono select-none"
                style={{ color: "rgba(74,222,128,0.45)" }}
              >
                @
              </span>

              <input
                id="username"
                type="text"
                className="w-full rounded-lg pl-8 pr-16 py-3 text-sm outline-none transition-colors"
                style={{
                  background: "#1f2d1c",
                  border: `1px solid ${
                    error
                      ? "rgba(248,113,113,0.45)"
                      : "rgba(74,222,128,0.15)"
                  }`,
                  color: "#d4edbb",
                  fontFamily: "ui-monospace, monospace",
                }}
                placeholder="cool_creator_42"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Clear error as the user starts correcting input
                  if (error) setError(null);
                }}
                disabled={loading}
                autoFocus
                autoComplete="off"
                minLength={3}
                maxLength={20}
              />

              {/* Live character counter */}
              <span
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs tabular-nums font-mono transition-colors"
                style={{
                  color:
                    charCount === 0
                      ? "rgba(187,240,166,0.2)"
                      : isValid
                      ? "#4ade80"
                      : "rgba(187,240,166,0.35)",
                }}
              >
                {charCount}/20
              </span>
            </div>

            <p className="text-xs" style={{ color: "rgba(187,240,166,0.3)" }}>
              3–20 characters · letters, numbers, and underscores only
            </p>
          </div>

          {/* Server-side error */}
          {error && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#fca5a5",
              }}
            >
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                loading || !isValid ? "rgba(74,222,128,0.15)" : "#4ade80",
              color:
                loading || !isValid ? "rgba(74,222,128,0.35)" : "#052e16",
              cursor: loading || !isValid ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving…
              </>
            ) : (
              <>
                Continue
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
