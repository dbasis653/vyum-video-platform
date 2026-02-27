"use client";

/**
 * app/(app)/onboarding/page.tsx
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
        // Display the validation message returned by the API
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

  return (
    // Full-screen centred layout — intentionally no sidebar yet (user isn't
    // fully set up), so we use a standalone page outside the app shell
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-6">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Pick your username</h1>
            <p className="text-base-content/60 mt-2 text-sm">
              This is how others will identify you. You can only do this once.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label" htmlFor="username">
                <span className="label-text font-medium">Username</span>
              </label>
              <input
                id="username"
                type="text"
                className={`input input-bordered w-full ${error ? "input-error" : ""}`}
                placeholder="e.g. cool_creator_42"
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

              {/* Inline validation hint */}
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  3–20 characters · letters, numbers, and underscores only
                </span>
              </label>
            </div>

            {/* Server-side error message */}
            {error && (
              <div className="alert alert-error py-2 text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || username.trim().length < 3}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Saving…
                </>
              ) : (
                "Continue →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
