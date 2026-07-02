import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const apiKey = request.headers.get("x-api-key") || undefined;

    // Auth check
    if (userId) {
      const { data: account, error: authErr } = await supabase
        .from("accounts").select("role, username").eq("id", userId).single();
      if (authErr || !account || (account.role !== "admin" && account.username !== "admin")) {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      }
    } else if (apiKey) {
      const expectedKey = process.env.API_SECRET_KEY;
      if (apiKey !== expectedKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Missing credentials" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("creatures")
      .select("id, name, scientific_name")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, creatures: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
