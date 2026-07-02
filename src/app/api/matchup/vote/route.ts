import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { submitMatchupVote } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";

export async function POST(request: Request) {
  try {
    const { matchupSlug, voteFor, userId } = await request.json();
    
    // Retrieve IP for anonymous vote protection
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const result = await submitMatchupVote(matchupSlug, voteFor, userId, ip);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    revalidateTag(CACHE_TAGS.MATCHUP_VOTES, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
