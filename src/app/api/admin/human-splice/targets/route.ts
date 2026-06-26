import { NextResponse } from "next/server";
import { selectHumanSpliceTargets } from "@/lib/human-splice-selection";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const apiKey = request.headers.get("x-api-key") || undefined;

    const result = await selectHumanSpliceTargets(userId, apiKey);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      targets: result.targets
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
