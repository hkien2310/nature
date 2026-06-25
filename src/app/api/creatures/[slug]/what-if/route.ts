import { NextResponse } from "next/server";
import { getCreatureWhatIfs, getDBCreatureById } from "@/lib/db";

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

    const whatIfs = await getCreatureWhatIfs(creature.id);

    return NextResponse.json({
      success: true,
      whatIfs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
