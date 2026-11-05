"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";
import CommunityForm from "@/components/CreatCommnunity/Component/CommunityForm";
import CommunityList from "@/components/CreatCommnunity/Component/CommunityList";
import { Loader2, LayoutGrid, Clock } from "lucide-react";
import { useState } from "react";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type Branch = {
  id: string;
  name: string;
};

export default function CreateCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  // State để hiển thị thông báo sau khi tạo thành công
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // =========================
  // 1. QUERY: LẤY DANH SÁCH NHÁNH (BRANCHES)
  // =========================
  const { data: branches = [] } = useQuery({
    queryKey: ["community-branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_branches")
        .select("id, name");
      if (error) throw error;
      return data as Branch[];
    },
    staleTime: 1000 * 60 * 60,
  });

  // =========================
  // 2. QUERY: LẤY DANH SÁCH CỘNG ĐỒNG (Đã xét duyệt)
  // =========================
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Community[];
    },
  });

  const handleOpenCommunity = (id: string) => {
    router.push(`/communities/${id}`);
  };

  // =========================
  // 3. XỬ LÝ SAU KHI TẠO THÀNH CÔNG
  // =========================
  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["communities-list"] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 8000);
  };

  return (
    /* FIX: Dùng --bg-surface để nền trang luôn đi theo nền web */
    <div 
      className="min-h-screen flex flex-col items-center justify-start px-4 py-12 transition-colors duration-300"
      style={{ backgroundColor: 'rgb(var(--bg-surface))' }}
    >
      
      {/* Thông báo chờ duyệt (Toast/Alert) */}
      {showSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div 
            className="border-l-4 border-orange-400 shadow-2xl p-4 rounded-lg flex items-start gap-3 max-w-md transition-colors duration-300"
            style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'orange' }}
          >
            <div className="text-orange-400 mt-1">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-normal" style={{ color: 'rgb(var(--text-main))' }}>Yêu cầu đã được gửi!</h4>
              <p className="text-sm font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
                Cộng đồng của bạn đang chờ quản trị viên xét duyệt. Chúng tôi sẽ thông báo cho bạn ngay khi hoàn tất.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-4xl mb-10 text-center">
        <h1 
          className="text-4xl font-light mb-2"
          style={{ color: 'rgb(var(--text-main))' }}
        >
          Khởi tạo Không gian
        </h1>
        <p className="font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
          Xây dựng cộng đồng của riêng bạn chỉ trong vài bước
        </p>
      </div>

      {/* Form tạo cộng đồng */}
      <CommunityForm onCreated={handleCreated} branches={branches} />
      
      {/* Danh sách cộng đồng hiện có */}
      <div className="w-full max-w-4xl mt-16">
        <div className="flex items-center gap-3 mb-6 px-2">
          {/* Đã loại bỏ khung nền bao quanh icon LayoutGrid */}
          <LayoutGrid size={24} className="text-orange-400" />
          <h2 className="text-2xl font-normal" style={{ color: 'rgb(var(--text-main))' }}>
            Khám phá cộng đồng
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
            <p className="font-normal" style={{ color: 'rgb(var(--text-muted))' }}>Đang tải danh sách...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {communities.length > 0 ? (
                <CommunityList communities={communities} onOpen={handleOpenCommunity} />
            ) : (
                <div 
                  className="text-center py-10 rounded-2xl border-2 border-dashed transition-colors duration-300"
                  style={{ borderColor: 'rgba(var(--border-main), 0.5)' }}
                >
                    <p className="font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
                      Chưa có cộng đồng nào được duyệt.
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}