import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyIdToken } from "@/lib/firebase/verify-token";

export async function requireUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const decoded = await verifyIdToken(authorization.slice(7));

  const [user] = await db
    .select({
      id: users.id,
      firebaseUid: users.firebaseUid,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.firebaseUid, decoded.uid))
    .limit(1);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}