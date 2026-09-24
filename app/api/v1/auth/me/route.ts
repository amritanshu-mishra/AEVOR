import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/verify-token";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing authentication token" },
      { status: 401 },
    );
  }

  try {
    const token = authorization.slice(7);
    const decodedToken = await verifyIdToken(token);

    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid authentication token" },
      { status: 401 },
    );
  }
}