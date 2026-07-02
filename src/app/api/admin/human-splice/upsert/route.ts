import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.API_SECRET_KEY;
    
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid API key." }, { status: 403 });
    }

    // 2. Parse body
    const items = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload: Expected an array of objects." }, { status: 400 });
    }

    // 3. Setup Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    // Prefer service role key for backend writes, fallback to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials are not configured on the server." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Upsert records
    let successCount = 0;
    const errors = [];

    for (const item of items) {
      if (!item.creature_id || !item.title || !item.slug || !item.trait_name || !item.spliced_stats) {
        errors.push({ slug: item.slug, message: "Missing required fields." });
        continue;
      }

      const { data, error } = await supabase
        .from("human_splices")
        .upsert({
          creature_id: item.creature_id,
          title: item.title,
          trait_name: item.trait_name,
          slug: item.slug,
          spliced_stats: item.spliced_stats,
          formulas_and_data: item.formulas_and_data || {},
          summary: item.summary || null,
          sci_fi_hype: item.sci_fi_hype,
          scientific_reality: item.scientific_reality,
          updated_at: new Date().toISOString()
        }, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        errors.push({ slug: item.slug, message: error.message });
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      upserted: successCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
