import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

type RequireSessionResult =
  | { session: Session; unauthorized: null }
  | { session: null; unauthorized: NextResponse };

export async function requireSession(): Promise<RequireSessionResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, unauthorized: null };
}
