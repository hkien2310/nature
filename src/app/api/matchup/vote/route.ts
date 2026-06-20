import { NextResponse } from "next/server";
import { submitMatchupVote } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { matchupSlug, voteFor, userId } = await request.json();
    
    // Retrieve IP for anonymous vote protection
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const result = await submitMatchupVote(matchupSlug, voteFor, userId, ip);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
