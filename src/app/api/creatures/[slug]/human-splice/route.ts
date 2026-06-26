import { NextResponse } from "next/server";
import { getCreatureHumanSplices, getDBCreatureById } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const creature = await getDBCreatureById(slug);
    
    if (!creature) {
      return NextResponse.json({ error: "Creature not found" }, { status: 404 });
    }

    const splices = await getCreatureHumanSplices(creature.id);

    return NextResponse.json({
      success: true,
      splices
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
