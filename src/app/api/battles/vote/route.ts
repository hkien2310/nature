import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { submitBattleVote } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";

export async function POST(request: Request) {
  try {
    const { battleId, voteFor, userId } = await request.json();
    
    // Retrieve IP for anonymous vote protection
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const result = await submitBattleVote(battleId, voteFor, userId, ip);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    revalidateTag(CACHE_TAGS.BATTLES, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
