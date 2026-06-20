import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const { strength, durability, speed, weaponry, special, lethality } = body;

    // Validate inputs
    const ratings = [strength, durability, speed, weaponry, special, lethality];
    for (const r of ratings) {
      if (typeof r !== "number" || r < 1 || r > 100) {
        return NextResponse.json(
          { error: "Invalid ratings. All scores must be between 1 and 100." },
          { status: 400 }
        );
      }
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const { error } = await supabase.from("votes").insert({
      creature_id: slug,
      strength,
      durability,
      speed,
      weaponry,
      special,
      lethality,
      user_ip: ip,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
