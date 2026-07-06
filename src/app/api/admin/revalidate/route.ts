import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.API_SECRET_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tag } = await request.json();

    if (!tag) {
      return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
    }

    // @ts-ignore - Next.js type check fix
    revalidateTag(tag, { expire: 0 });

    return NextResponse.json({
      success: true,
      message: `Successfully revalidated tag: ${tag}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
