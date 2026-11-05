"use client";

import { useState } from "react";
import { Loader2, Users, CheckCircle2, AlignLeft, Info, Clock } from "lucide-react";
import type { Database } from "@/types/supabase";
import { createCommunityAction } from "@/app/actions/CreatComunities";

type Community = Database["public"]["Tables"]["communities"]["Row"];

interface Branch {
  id: string;
  name: string;
}

type Props = {
  onCreated: (newCommunity: Community) => void;
  branches: Branch[];
};

export default function CommunityForm({ onCreated, branches }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    branch_id: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "pending" | null }>({
    text: "",
    type: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch_id) {
      setMessage({ text: "❌ Vui lòng chọn một lĩnh vực hoạt động!", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: null });

    try {
      const newCommunity = await createCommunityAction({
        title: formData.title.trim(),
        branch_id: formData.branch_id,
        description: formData.description.trim(),
      });

      setMessage({ 
        text: "✅ Đã gửi yêu cầu xét duyệt! Cộng đồng sẽ hiển thị sau khi được phê duyệt.", 
        type: "pending" 
      });
      
      setFormData({ title: "", branch_id: "", description: "" });
      onCreated(newCommunity);
      
    } catch (err: unknown) {
      console.error("Lỗi hệ thống:", err);
      let errorMessage = "Không thể gửi yêu cầu";
      if (err instanceof Error) errorMessage = err.message;
      setMessage({ text: `❌ Lỗi: ${errorMessage}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full max-w-2xl rounded-[2.5rem] shadow-2xl border p-8 md:p-10 mb-10 transition-colors duration-300"
      style={{ 
        backgroundColor: 'rgb(var(--bg-card))', 
        borderColor: 'rgba(var(--border-main), 0.5)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      }}
    >
      
      <div className="flex flex-col items-center mb-10 text-center">
        <Users size={32} strokeWidth={1.5} className="mb-4 text-orange-400" />
        
        <h2 className="text-3xl font-light tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>Thành lập Không gian</h2>
        <p className="font-normal mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Yêu cầu của bạn sẽ được xét duyệt trên hệ thống</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tên cộng đồng */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-normal uppercase ml-1" style={{ color: 'rgb(var(--text-muted))' }}>
            <AlignLeft size={14} /> Tên định danh cộng đồng
          </label>
          <input
            type="text"
            name="title"
            placeholder="Ví dụ: Hội yêu iPhone..."
            value={formData.title}
            onChange={handleChange}
            className="w-full border-2 focus:border-orange-400 rounded-2xl p-4 outline-none transition-all font-normal placeholder:opacity-50 bg-transparent"
            style={{ 
              borderColor: 'rgba(var(--border-main), 0.5)',
              color: 'rgb(var(--text-main))'
            }}
            required
          />
        </div>

        {/* Lĩnh vực */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-normal uppercase ml-1" style={{ color: 'rgb(var(--text-muted))' }}>
            <Info size={14} /> Lĩnh vực hoạt động
          </label>
          <div className="grid grid-cols-2 gap-4">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, branch_id: branch.id }))}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  formData.branch_id === branch.id
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-md shadow-orange-400/10"
                    : "hover:border-orange-200 bg-transparent"
                }`}
                style={formData.branch_id !== branch.id ? { 
                  borderColor: 'rgba(var(--border-main), 0.5)',
                  color: 'rgb(var(--text-muted))'
                } : {}}
              >
                <span className="font-normal text-sm">{branch.name}</span>
                {formData.branch_id === branch.id && (
                  <CheckCircle2 size={18} className="text-orange-500 animate-in zoom-in" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mô tả */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-normal uppercase ml-1" style={{ color: 'rgb(var(--text-muted))' }}>
             Mô tả & Mục tiêu
          </label>
          <textarea
            name="description"
            placeholder="Giới thiệu ngắn gọn về cộng đồng của bạn..."
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border-2 focus:border-orange-400 rounded-2xl p-4 outline-none transition-all resize-none font-normal placeholder:opacity-50 bg-transparent"
            style={{ 
              borderColor: 'rgba(var(--border-main), 0.5)',
              color: 'rgb(var(--text-main))'
            }}
          />
        </div>

        {/* Nút submit: Không viền ở trạng thái thường, đổi màu khi hover */}
        <button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className={`w-full flex items-center justify-center py-5 rounded-2xl font-normal text-lg transition-all duration-300 active:scale-[0.98] ${
            loading || !formData.title.trim()
            ? "opacity-20 cursor-not-allowed" 
            : "hover:bg-[rgb(var(--text-main))] hover:text-[rgb(var(--bg-card))] hover:shadow-xl shadow-none cursor-pointer"
          }`}
          style={{
            backgroundColor: 'rgba(var(--border-main), 0.1)', // Màu nền rất nhẹ để thấy nút nhưng không gây nặng nề
            color: 'rgb(var(--text-main))'
          }}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            "Gửi yêu cầu xét duyệt"
          )}
        </button>
      </form>

      {/* Thông báo */}
      {message.type && (
        <div 
          className={`mt-8 p-5 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 ${
            message.type === "pending" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
            message.type === "success" ? "bg-green-500/10 text-green-600 border-green-500/20" :
            "bg-red-500/10 text-red-500 border-red-500/20"
          }`}
        >
          {message.type === "pending" && <Clock className="w-5 h-5 animate-pulse" />}
          <p className="font-normal text-sm leading-relaxed">{message.text}</p>
        </div>
      )}
    </div>
  );
}