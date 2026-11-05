"use client";

import React from "react";
import Image from "next/image";
import { Pencil, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  userId?: string;
  bannerUrl: string | null;
  title?: string | null;
  isOwner: boolean;
  // Giữ lại để tương thích ngược
  uploading?: boolean;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ProfileBanner({
  userId,
  bannerUrl,
  title,
  isOwner,
}: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // =========================
  // MUTATION: XỬ LÝ UPLOAD & CẬP NHẬT DB
  // =========================
  const { mutate: uploadBanner, isPending } = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("Yêu cầu mã định danh người dùng");

      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // 1. Upload ảnh mới lên Storage
      const { error: uploadError } = await supabase.storage
        .from("user-profile-banner")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // 2. Lấy Public URL
      const { data: urlData } = supabase.storage
        .from("user-profile-banner")
        .getPublicUrl(filePath);

      const newBannerUrl = urlData.publicUrl;

      // 3. Cập nhật URL vào bảng users
      const { error: dbError } = await supabase
        .from("users")
        .update({ banner_url: newBannerUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      return newBannerUrl;
    },
    onSuccess: () => {
      // Làm mới dữ liệu profile trên toàn app
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
    onError: (error: Error) => {
      alert(`Lỗi cập nhật banner: ${error.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      uploadBanner(file);
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div 
      className="relative group w-full h-full overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }}
    >
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={`${title ?? "Profile"} banner`}
          fill
          className={`object-cover transition-transform duration-700 ${
            isPending ? "scale-105 blur-sm" : "scale-100 blur-0"
          }`}
          priority
          sizes="100vw"
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center bg-gradient-to-br"
          style={{ 
            backgroundImage: `linear-gradient(to bottom right, rgba(var(--border-main), 0.2), transparent)` 
          }}
        >
          <ImageIcon className="w-12 h-12" style={{ color: 'rgba(var(--text-muted), 0.3)' }} />
        </div>
      )}

      {/* Overlay khi đang loading */}
      {isPending && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px] z-20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {isOwner && (
        <div className="absolute top-4 right-4 z-30">
          <input
            id="profileBannerInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />

          <label
            htmlFor="profileBannerInput"
            className={`flex items-center gap-2 px-4 py-2 shadow-xl rounded-full 
              transition-all duration-200 active:scale-95 border cursor-pointer
              ${isPending 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:scale-105 hover:border-orange-400"
              }`}
            style={{
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgba(var(--border-main), 0.3)',
              color: 'rgb(var(--text-main))'
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
            <span className="text-xs font-normal">Thay đổi ảnh bìa</span>
          </label>
        </div>
      )}

      {/* Gradient giúp nội dung bên trên dễ đọc hơn */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}