// src/app/api/listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth/guards";

// Chỉ cho phép các cột người dùng được phép ghi (chống mass-assignment).
// LƯU Ý: bảng `products` KHÔNG có cột `price`/`category` — không đưa vào schema
// kẻo insert sẽ lỗi "Could not find the 'price' column".
const ListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  images: z.array(z.string()).max(10).optional().nullable(),
  community_id: z.string().uuid().optional().nullable(),
  tag_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();

    const body = await req.json().catch(() => null);
    const parsed = ListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tag_id, ...fields } = parsed.data;

    // user_id luôn lấy từ session, không bao giờ từ body.
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...fields,
        user_id: user.id,
        status: "published",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (tag_id && data) {
      const { error: tagError } = await supabase
        .from("product_tags")
        .insert({ product_id: data.id, tag_id });
      if (tagError) console.error("Lỗi gắn tag:", tagError.message);
    }

    return NextResponse.json({ success: true, id: data?.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Lỗi /api/listing:", err);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
