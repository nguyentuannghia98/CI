// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth/guards";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Dùng đúng bucket ảnh sản phẩm mà app đang dùng (quickpost/PostModal). Trước đây
// mặc định "product-images" — bucket này KHÔNG tồn tại nên upload luôn 500.
const BUCKET = process.env.PRODUCT_IMAGES_BUCKET || "images";

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực: user_id lấy từ session, KHÔNG tin client.
    const { supabase, user } = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Định dạng ảnh không được hỗ trợ" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ảnh vượt quá 5MB" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ success: true, path: filePath, url: publicUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Lỗi /api/upload:", err);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
