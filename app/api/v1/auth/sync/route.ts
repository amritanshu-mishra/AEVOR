import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyIdToken } from "@/lib/firebase/verify-token";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = authorization.slice(7);
    const decoded = await verifyIdToken(token);

    if (!decoded.email) {
      return NextResponse.json(
        { error: "Firebase account has no email" },
        { status: 400 },
      );
    }

    const [user] = await db
      .insert(users)
      .values({
        firebaseUid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name ?? null,
      })
      .onConflictDoUpdate({
        target: users.firebaseUid,
        set: {
          email: decoded.email,
          displayName: decoded.name ?? null,
        },
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}