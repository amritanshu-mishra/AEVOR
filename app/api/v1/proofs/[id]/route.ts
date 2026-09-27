import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proofs } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const [proof] = await db
      .delete(proofs)
      .where(
        and(
          eq(proofs.id, id),
          eq(proofs.userId, user.id),
        ),
      )
      .returning({
        id: proofs.id,
      });

    if (!proof) {
      return NextResponse.json(
        { error: "Proof not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete proof" },
      { status: 500 },
    );
  }
}