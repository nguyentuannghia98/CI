"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCommunityAction(formData: {
  title: string;
  branch_id: string;
  description: string;
}) {
  const supabase = await createClient();

  // 1. Kiểm tra Authentication phía Server
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }

  // 2. Lấy tên Branch để làm Category (Vì cột category là bắt buộc trong schema)
  const { data: branchData, error: branchError } = await supabase
    .from("community_branches")
    .select("name")
    .eq("id", formData.branch_id)
    .single();

  if (branchError || !branchData) {
    throw new Error("Lĩnh vực hoạt động không hợp lệ.");
  }

  // 3. Chuẩn bị dữ liệu Insert khớp hoàn toàn với Schema mới nhất
  const insertData = {
    title: formData.title.trim(),
    branch_id: formData.branch_id,
    category: branchData.name, 
    description: formData.description.trim(),
    members_count: 1,
    is_approved: false, // Luôn mặc định chờ duyệt để đảm bảo an toàn
    created_by: user.id, // Đã mở comment để trigger ghi log có user_id
  };

  // 4. Thực thi Insert vào Database
  const { data, error } = await supabase
    .from("communities")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    // Log lỗi chi tiết ra Terminal (Server console) để bạn dễ debug
    console.error("Supabase Insert Error:", error.message, error.details);
    throw new Error(`Lỗi hệ thống: ${error.message}`);
  }

  // 5. Thêm người tạo làm OWNER của cộng đồng.
  // Nếu không có bước này, người tạo không thể đăng bài / quản trị cộng đồng mình vừa tạo.
  const { error: memberError } = await supabase.from("community_members").insert({
    community_id: data.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Compensating rollback: không để lại cộng đồng "mồ côi" không có chủ.
    await supabase.from("communities").delete().eq("id", data.id);
    console.error("Supabase Member Insert Error:", memberError.message, memberError.details);
    throw new Error(`Không thể khởi tạo quyền quản trị cộng đồng: ${memberError.message}`);
  }

  // 6. Làm mới cache
  // Điều này giúp trang danh sách cộng đồng cập nhật dữ liệu mới ngay lập tức
  revalidatePath("/communities");
  revalidatePath(`/communities/${data.id}`);

  return data;
}