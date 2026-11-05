import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const {
      title,
      productImage,
      productValue,
      voucherCost,
      maxParticipants,
      durationMinutes,
      storeName,
      userId: bodyUserId,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Vui lòng nhập tên phòng sàn đấu" }, { status: 400 });
    }

    const numValue = Number(productValue) || 1000000;
    const numCost = Number(voucherCost) || 10000;
    const numMax = Number(maxParticipants) || 5;
    const numDuration = Number(durationMinutes) || 45;

    // 1. Lấy thông tin user đăng nhập
    let creatorId: string | null = null;
    let creatorName = storeName?.trim() || "NexLoot Store";
    let creatorAvatar: string | null = null;

    try {
      const serverSupabase = await createClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user) {
        creatorId = user.id;
        creatorName = user.user_metadata?.username || user.email?.split("@")[0] || creatorName;
        creatorAvatar = user.user_metadata?.avatar_url || null;
      }
    } catch {
      // Bỏ qua lỗi cookie nếu không có session
    }

    // Fallback sang bodyUserId nếu client truyền
    if (!creatorId && bodyUserId) {
      creatorId = bodyUserId;
    }

    const admin = await createAdminClient();

    // 2. Nếu có creatorId, tra cứu thêm bảng users để lấy đúng avatar và username thực tế
    if (creatorId) {
      try {
        const { data: userProfile } = await (admin as any)
          .from("users")
          .select("id, username, avatar_url")
          .eq("id", creatorId)
          .single();

        if (userProfile) {
          if (userProfile.username) creatorName = userProfile.username;
          if (userProfile.avatar_url) creatorAvatar = userProfile.avatar_url;
        }
      } catch (err) {
        console.warn("Không tìm thấy profile người dùng:", err);
      }
    }

    const expiresAt = new Date(Date.now() + numDuration * 60 * 1000).toISOString();

    // 3. Insert phòng vào arena_rooms (Admin bypass RLS)
    // Lưu ý: bảng arena_rooms KHÔNG có cột created_by, danh tính người tạo được lưu qua store_name và arena_participants
    const { data: newRoom, error: roomError } = await (admin as any)
      .from("arena_rooms")
      .insert({
        title: String(title).trim(),
        product_image: productImage || null,
        product_value: numValue,
        voucher_cost: numCost,
        max_participants: numMax,
        status: "WAITING",
        expires_at: expiresAt,
        store_name: creatorName,
      })
      .select("*")
      .single();

    if (roomError || !newRoom) {
      console.error("Lỗi insert arena_rooms:", roomError);
      return NextResponse.json(
        { error: roomError?.message || "Không thể tạo phòng đấu trường" },
        { status: 500 }
      );
    }

    // 4. Nếu có creatorId, thêm ngay creator vào danh sách người tham gia (arena_participants)
    let participants = [];
    if (creatorId) {
      try {
        await (admin as any)
          .from("arena_participants")
          .insert({
            room_id: newRoom.id,
            user_id: creatorId,
          });

        participants.push({
          id: creatorId,
          name: creatorName,
          avatar: creatorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorId}`,
        });
      } catch (partErr) {
        console.warn("Không thể thêm người tạo vào arena_participants:", partErr);
      }
    }

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        title: newRoom.title,
        productImage: newRoom.product_image || "",
        productValue: newRoom.product_value,
        voucherCost: newRoom.voucher_cost,
        maxParticipants: newRoom.max_participants,
        currentParticipants: participants,
        status: newRoom.status,
        expiresAt: new Date(newRoom.expires_at).getTime(),
        storeName: newRoom.store_name,
        creator: {
          id: creatorId || undefined,
          name: creatorName,
          avatar: creatorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${newRoom.id}`,
          verified: true,
        },
      },
    });
  } catch (err: any) {
    console.error("Lỗi tổng quát tại /api/arena/create:", err);
    return NextResponse.json({ error: err?.message || "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}

