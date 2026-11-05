"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Users, Camera, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommunityAvatar } from "@/app/actions/ComunnitiesActions/Communities";

interface CommunityAvatarProps {
  communityId: string;
  url: string | null;
  alt?: string;
  role: string; // Nhận từ DB (mod, member...)
}

export default function CommunityAvatar({
  communityId,
  url,
  alt,
  role,
}: CommunityAvatarProps) {
  const queryClient = useQueryClient();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // CẬP NHẬT: Chỉ cho phép 'mod' có quyền chỉnh sửa (bỏ admin và owner)
  const canEdit = role?.toLowerCase() === "mod";

  // Tối ưu bộ nhớ: Thu hồi Object URL khi unmount hoặc khi preview thay đổi
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!communityId) throw new Error("Thiếu ID cộng đồng");

      const formData = new FormData();
      formData.append("avatar", file);

      const result = await updateCommunityAvatar(communityId, formData);

      if (!result.success) {
        throw new Error(result.error || "Không thể cập nhật ảnh đại diện");
      }

      return result.url;
    },
    onSuccess: () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      setImgError(false);
      
      // Refresh dữ liệu để đồng bộ UI
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
    },
    onError: (err: Error) => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      alert("Lỗi cập nhật ảnh đại diện: " + err.message);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !communityId) return;

    // Giới hạn 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh đại diện nên dưới 2MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setImgError(false);

    uploadMutation.mutate(file);
  };

  const showLoading = uploadMutation.isPending;
  const displayUrl = localPreview || url;

  // Kiểm tra URL hợp lệ để tránh lỗi 400 Bad Request
  const isValidUrl = useMemo(() => {
    if (!displayUrl || typeof displayUrl !== "string" || displayUrl.trim() === "") return false;
    return displayUrl.startsWith("http") || displayUrl.startsWith("/") || displayUrl.startsWith("blob:");
  }, [displayUrl]);

  return (
    <div className="relative -mt-16 sm:-mt-20 w-32 h-32 sm:w-40 sm:h-40 shrink-0 z-20">
      {/* KHUNG AVATAR TRÒN */}
      <div 
        className="w-full h-full rounded-full border-4 shadow-xl overflow-hidden relative group/avatar transition-colors duration-300"
        style={{ 
          backgroundColor: 'rgb(var(--bg-card))', 
          borderColor: 'rgb(var(--bg-card))' 
        }}
      >
        {isValidUrl && !imgError ? (
          <Image
            src={displayUrl as string}
            alt={alt ?? "Avatar"}
            fill
            className={`object-cover transition-all duration-500 ${
              showLoading ? "blur-sm opacity-50 scale-110" : "scale-100"
            }`}
            // Thêm priority để sửa lỗi LCP
            priority
            // Thêm sizes chuẩn để sửa lỗi hiệu năng
            sizes="(max-width: 640px) 128px, 160px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br"
            style={{ 
              backgroundImage: `linear-gradient(to bottom right, rgba(var(--border-main), 0.1), rgba(var(--border-main), 0.2))`,
              color: 'rgb(var(--text-muted))'
            }}
          >
            <Users size={48} strokeWidth={1.5} />
          </div>
        )}

        {showLoading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px] z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* NÚT CAMERA UPLOAD - Chỉ hiện nếu là mod */}
      {canEdit && (
        <>
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={showLoading}
          />
          <label
            htmlFor="avatarInput"
            className={`absolute bottom-2 right-2 p-2.5 shadow-xl rounded-full cursor-pointer 
              transition-all duration-200 border z-30
              ${showLoading 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:scale-110 active:scale-90 hover:border-orange-400"
              }`}
            style={{
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgba(var(--border-main), 0.3)',
              color: 'rgb(var(--text-main))'
            }}
          >
            {showLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </label>
        </>
      )}
    </div>
  );
}