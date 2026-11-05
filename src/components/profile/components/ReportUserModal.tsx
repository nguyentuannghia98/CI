"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";

type Props = {
  reportedUser: {
    id: string;
    username?: string | null;
  };
  onClose: () => void;
};

const REASONS = [
  "Spam / quảng cáo",
  "Lừa đảo",
  "Nội dung không phù hợp",
  "Mạo danh người khác",
  "Ngôn từ thù ghét / xúc phạm",
  "Lý do khác",
];

export default function ReportUserModal({ reportedUser, onClose }: Props) {
  const supabase = createClient();
  const userId = useCurrentUser();
  
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // =========================
  // MUTATION: GỬI TỐ CÁO
  // =========================
  const { mutate: submitReport, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Bạn cần đăng nhập để thực hiện tố cáo");
      if (!reason) throw new Error("Vui lòng chọn lý do tố cáo");

      const { error } = await supabase.from("user_reports").insert({
        reporter_id: userId,
        reported_user_id: reportedUser.id,
        reason,
        details: detail.trim() || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsSuccess(true);
      // Giảm thời gian chờ xuống một chút để trải nghiệm nhanh hơn
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    },
    onError: (err: Error) => {
      // Thay thế 'any' bằng 'Error'
      alert(err.message || "Gửi tố cáo thất bại");
    },
  });

  // Nếu gửi thành công, hiển thị thông báo thay vì modal chọn lý do
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Đã nhận tố cáo</h3>
          <p className="text-gray-500 text-sm">
            Cảm ơn bạn đã báo cáo. Đội ngũ quản trị sẽ xem xét tài khoản này sớm nhất có thể.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Click outside to close (optional but recommended) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="text-lg font-bold text-gray-900">
              Tố cáo người dùng
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4">
            Bạn đang báo cáo tài khoản <span className="font-bold text-gray-900">{reportedUser.username || "người dùng"}</span>. Vui lòng chọn lý do chính xác nhất:
          </p>

          {/* REASONS LIST */}
          <div className="grid grid-cols-1 gap-2 mb-6">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer
                  ${reason === r
                    ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {r}
                {reason === r && <div className="w-2 h-2 bg-red-600 rounded-full" />}
              </button>
            ))}
          </div>

          {/* DETAIL INPUT */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Mô tả chi tiết (không bắt buộc)
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Cung cấp thêm bằng chứng hoặc mô tả hành vi..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-600 outline-none transition-all resize-none"
              rows={3}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              disabled={isPending}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => submitReport()}
              disabled={isPending || !reason}
              className="flex-1 px-4 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý
                </>
              ) : (
                "Gửi tố cáo ngay"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}