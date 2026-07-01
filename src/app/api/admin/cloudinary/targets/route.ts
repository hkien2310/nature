import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.API_SECRET_KEY || "bioforce_secret_key_2026";
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid or missing API key." }, { status: 401 });
    }

    // 1. Fetch creatures from database
    const { data, error } = await supabase
      .from("creatures")
      .select("id, name, scientific_name, characteristics, unique_traits, ai_p4p_score, images");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: "No creatures found." }, { status: 404 });
    }

    // 2. Sort logic:
    // - Primary: Fewest images first (null/empty = 0)
    // - Secondary: Highest p4p_score first
    const sorted = [...data].sort((a, b) => {
      const aImageCount = a.images && Array.isArray(a.images) ? a.images.length : 0;
      const bImageCount = b.images && Array.isArray(b.images) ? b.images.length : 0;
      
      if (aImageCount !== bImageCount) {
        return aImageCount - bImageCount; // Ascending
      }

      // Tie-breaker: Highest p4p_score
      const aScore = a.ai_p4p_score || 0;
      const bScore = b.ai_p4p_score || 0;
      return bScore - aScore; // Descending
    });

    // 3. Return the top target
    const target = sorted[0];

    return NextResponse.json({
      success: true,
      target: target
    });

  } catch (error: any) {
    console.error("Error fetching image target:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
