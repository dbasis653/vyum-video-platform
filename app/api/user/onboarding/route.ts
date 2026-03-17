import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// completeOnboarding — checks username uniqueness, upserts the user row, sets Clerk metadata.
// Extracted to services/user.service.ts — keeps this route file thin (HTTP concerns only).
import { completeOnboarding } from "@/services/user.service";

// Regex: only letters, digits, and underscores; 3 to 20 characters.
// Stays here because it is used for request validation before the service is called.
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Maps a service error (with optional .status) to a NextResponse.
function serviceError(err: unknown) {
  const e = err as { status?: number; message?: string };
  return NextResponse.json(
    { error: e.message ?? "Internal server error" },
    { status: e.status ?? 500 },
  );
}

export async function PATCH(request: NextRequest) {
  // 1. Authenticate — get the Clerk userId from the active session
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse and validate the username from the request body
  let username: string;
  try {
    const body = await request.json();
    username = (body.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–20 characters and contain only letters, numbers, or underscores",
      },
      { status: 400 },
    );
  }

  try {
    await completeOnboarding(userId, username);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serviceError(err);
  }
}
