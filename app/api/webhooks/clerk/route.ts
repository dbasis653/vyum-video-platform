/**
 * app/api/webhooks/clerk/route.ts
 *
 * Receives Clerk webhook events and keeps our PostgreSQL User table in sync.
 *
 * Why this exists:
 *   Clerk is the source of truth for authentication. Our DB User model stores
 *   a lightweight copy of each user's identity (clerkId, email) so that we can
 *   attach videos and images to a specific owner via foreign keys.
 *
 * How verification works:
 *   Clerk signs every webhook payload with a secret (WEBHOOK_SECRET).
 *   We use the `svix` library to verify that signature before trusting the body.
 *   IMPORTANT: svix needs the raw request body as a string — NOT parsed JSON.
 *   That is why we call request.text() here instead of request.json().
 *
 * Events handled:
 *   user.created  → insert a new User row (username stays null until onboarding)
 *   user.updated  → update email if it changed in Clerk
 *   user.deleted  → hard-delete the User row (cascades are set to RESTRICT in
 *                   schema, so videos/images must be deleted first — acceptable
 *                   for a dev-stage product)
 *
 * This route MUST be listed as a public route in middleware.ts so Clerk's own
 * auth middleware does not block the incoming webhook request.
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

// ─── Types for Clerk webhook payloads ────────────────────────────────────────

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedData {
  id: string; // Clerk userId, e.g. "user_2abc..."
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
}

interface ClerkUserUpdatedData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
}

interface ClerkUserDeletedData {
  id: string;
  deleted: boolean;
}

// ─── Helper: extract primary email from Clerk payload ────────────────────────

function getPrimaryEmail(
  emailAddresses: ClerkEmailAddress[],
  primaryId: string,
): string {
  const primary = emailAddresses.find((e) => e.id === primaryId);
  return primary?.email_address ?? emailAddresses[0]?.email_address ?? "";
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Read raw body as text — svix needs the exact bytes to verify the HMAC
  const rawBody = await request.text();

  // 2. Pull svix signature headers sent by Clerk
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix signature headers" },
      { status: 400 },
    );
  }

  // 3. Verify the payload signature using our webhook secret
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET env var is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: { type: string; data: unknown };
  try {
    const wh = new Webhook(webhookSecret);
    // verify() throws if the signature is invalid
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 4. Route by event type
  const eventType = event.type;

  try {
    // ── user.created ────────────────────────────────────────────────────────
    if (eventType === "user.created") {
      const data = event.data as ClerkUserCreatedData;
      const email = getPrimaryEmail(
        data.email_addresses,
        data.primary_email_address_id,
      );

      // username is intentionally left null — onboarding page will fill it in
      await prisma.user.create({
        data: {
          clerkId: data.id,
          email,
          username: null,
        },
      });

      console.log(`[webhook] user.created → DB user created for ${email}`);
    }

    // ── user.updated ────────────────────────────────────────────────────────
    else if (eventType === "user.updated") {
      const data = event.data as ClerkUserUpdatedData;
      const email = getPrimaryEmail(
        data.email_addresses,
        data.primary_email_address_id,
      );

      await prisma.user.update({
        where: { clerkId: data.id },
        data: { email },
      });

      console.log(
        `[webhook] user.updated → email updated for clerkId ${data.id}`,
      );
    }

    // ── user.deleted ────────────────────────────────────────────────────────
    else if (eventType === "user.deleted") {
      const data = event.data as ClerkUserDeletedData;

      // Only act if Clerk confirms the user is actually deleted
      if (data.deleted && data.id) {
        await prisma.user.delete({
          where: { clerkId: data.id },
        });
        console.log(
          `[webhook] user.deleted → DB user removed for clerkId ${data.id}`,
        );
      }
    }

    // ── unhandled events — return 200 to acknowledge receipt ────────────────
    else {
      console.log(`[webhook] unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`[webhook] error handling ${eventType}:`, err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 },
    );
  }
}
