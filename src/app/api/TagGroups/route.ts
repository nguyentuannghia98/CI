// app/api/tag-groups/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Không throw error ở đây khi build
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    // 0) Kiểm tra biến môi trường bên trong hàm để tránh lỗi build tĩnh
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env vars in runtime");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Khởi tạo client bên trong request handler
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { community_id, name } = body ?? {};

    if (!community_id || !name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1) Get user from token
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = userData.user.id;

    // 2) Check role in community_members
    const { data: memberRows, error: memberErr } = await supabaseAdmin
      .from("community_members")
      .select("role")
      .eq("community_id", community_id)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (memberErr) {
      return NextResponse.json({ error: "Failed to check membership" }, { status: 500 });
    }

    const { role } = memberRows as { role: string };
    const allowed = ["owner", "admin", "mod"];
    if (!role || !allowed.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Insert tag
    // LƯU Ý: bảng `tag_groups` không tồn tại trong database. App dùng bảng
    // `community_tags` (cột: name, community_id, created_by, group_id).
    const { data: insertData, error: insertErr } = await supabaseAdmin
      .from("community_tags")
      .insert([
        {
          community_id,
          name: name.trim(),
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ data: insertData }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}