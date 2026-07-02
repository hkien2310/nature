import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createBattle } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { CACHE_TAGS } from "@/lib/cache";

export async function POST(request: Request) {
  try {
    const { creatureAId, creatureBId, durationDays, title, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Access Denied: Quyền truy cập bị từ chối." }, { status: 403 });
    }

    // Verify username is admin in database
    const { data: account, error: getErr } = await supabase
      .from("accounts")
      .select("username")
      .eq("id", userId)
      .single();

    if (getErr || !account || account.username !== "admin") {
      return NextResponse.json({ error: "Access Denied: Bạn không có quyền Admin." }, { status: 403 });
    }

    const result = await createBattle(creatureAId, creatureBId, Number(durationDays), title);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    revalidateTag(CACHE_TAGS.BATTLES, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
