import { NextResponse } from "next/server";
import { getDBCreatureById } from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.API_SECRET_KEY || "bioforce_secret_key_2026";

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing API key." }, { status: 401 });
    }

    const { slug } = await params;
    const creature = await getDBCreatureById(slug);

    if (!creature) {
      return NextResponse.json({ error: "Creature not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, creature });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
