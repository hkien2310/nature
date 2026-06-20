import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password || username.trim() === "" || password.trim() === "") {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tên tài khoản và mật khẩu." }, { status: 400 });
    }

    if (username.trim().toLowerCase() === "admin") {
      return NextResponse.json({ error: "Không thể đăng ký tài khoản admin." }, { status: 400 });
    }

    // Check if account already exists
    const { data: existing, error: checkErr } = await supabase
      .from("accounts")
      .select("id")
      .eq("username", username.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Tên tài khoản đã tồn tại." }, { status: 400 });
    }

    // Insert new account
    const { data: newAcc, error: insErr } = await supabase
      .from("accounts")
      .insert({
        username: username.trim(),
        password: password // Store plain text or hash for simplicity in this local setup
      })
      .select("id, username")
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: newAcc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
