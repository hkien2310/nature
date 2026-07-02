import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabase } from "@/lib/supabase";
import { CACHE_TAGS } from "@/lib/cache";

export async function POST(request: Request) {
  try {
    const { creatureId, hasDocumentary, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Access Denied: Quyền truy cập bị từ chối." }, { status: 403 });
    }

    // Verify user role is admin in database
    const { data: account, error: getErr } = await supabase
      .from("accounts")
      .select("role")
      .eq("id", userId)
      .single();

    if (getErr || !account || account.role !== "admin") {
      return NextResponse.json({ error: "Access Denied: Bạn không có quyền Admin." }, { status: 403 });
    }

    // Update has_documentary
    const { error: updErr } = await supabase
      .from("creatures")
      .update({ has_documentary: hasDocumentary })
      .eq("id", creatureId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    revalidateTag(CACHE_TAGS.CREATURES, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
