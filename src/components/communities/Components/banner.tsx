"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommunityBanner } from "@/app/actions/ComunnitiesActions/Communities";

type Props = {
  communityId: string;
  bannerUrl: string | null;
  title?: string | null;
  role: string; // Nhận 'mod', 'member', v.v.
};

export default function CommunityBanner({
  communityId,
  bannerUrl,
  title,
  role,
}: Props) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(bannerUrl);

  // CẬP NHẬT: Chỉ cho phép người có role là 'mod' mới có quyền chỉnh sửa
  const canEdit = role?.toLowerCase() === "mod";

  useEffect(() => {
    setPreview(bannerUrl);
  }, [bannerUrl]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const { mutate: uploadBanner, isPending } = useMutation({
    mutationFn: async (file: File) => {
      if (!communityId) throw new Error("Thiếu ID cộng đồng");

      const formData = new FormData();
      formData.append("banner", file);

      const result = await updateCommunityBanner(communityId, formData);

      if (!result.success) {
        throw new Error(result.error || "Không thể cập nhật ảnh bìa");
      }

      return result.url;
    },
    onSuccess: (newUrl) => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setPreview(newUrl as string);
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
    },
    onError: (err: Error) => {
      setPreview(bannerUrl);
      alert("Lỗi tải ảnh bìa: " + err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      uploadBanner(file);
    }
  };

  return (
    <div 
      className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden group transition-colors duration-300"
      style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }}
    >
      {preview ? (
        <Image
          src={preview}
          alt={`${title ?? "Community"} banner`}
          fill
          className={`object-cover transition-all duration-700 ${
            isPending ? "scale-105 blur-md grayscale" : "scale-100 blur-0 grayscale-0"
          }`}
          priority
          sizes="100vw"
        />
      ) : (
        <div 
          className="w-full h-full bg-gradient-to-br flex items-center justify-center"
          style={{ 
            backgroundImage: `linear-gradient(to bottom right, rgba(var(--border-main), 0.1), transparent)` 
          }}
        >
          <ImageIcon className="w-12 h-12" style={{ color: 'rgba(var(--text-muted), 0.3)' }} />
        </div>
      )}

      {isPending && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px] z-10 animate-in fade-in duration-300">
          <div 
            className="p-4 rounded-2xl shadow-xl flex items-center gap-3 border"
            style={{ 
              backgroundColor: 'rgb(var(--bg-card))', 
              borderColor: 'rgba(var(--border-main), 0.3)' 
            }}
          >
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgb(var(--text-main))' }} />
            <span className="text-sm font-normal" style={{ color: 'rgb(var(--text-main))' }}>Đang lưu thay đổi...</span>
          </div>
        </div>
      )}

      {/* Nút upload chỉ hiển thị khi canEdit (role === 'mod') là true */}
      {canEdit && (
        <div className="absolute top-4 right-4 z-20">
          <input
            id="bannerInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />
          <label
            htmlFor="bannerInput"
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-normal text-sm shadow-2xl transition-all cursor-pointer border
              ${
                isPending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105 active:scale-95 hover:border-orange-400"
              }
            `}
            style={{
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgba(var(--border-main), 0.3)',
              color: 'rgb(var(--text-main))'
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {preview ? "Đổi ảnh bìa" : "Thêm ảnh bìa"}
          </label>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-70 pointer-events-none" />
    </div>
  );
}