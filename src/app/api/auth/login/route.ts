import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tên tài khoản và mật khẩu." }, { status: 400 });
    }

    // Query account
    const { data: account, error: getErr } = await supabase
      .from("accounts")
      .select("id, username, password, role")
      .eq("username", username.trim())
      .single();

    if (getErr || !account) {
      return NextResponse.json({ error: "Tên tài khoản không tồn tại." }, { status: 400 });
    }

    if (account.password !== password) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: account.id,
        username: account.username,
        role: account.role
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
