"use client";

import React, { useState, memo, useMemo } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";

export interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  name?: string | null;
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-16 h-16", 
  xl: "w-20 h-20",
};

const sizesMapQuery = {
  sm: "24px",
  md: "32px",
  lg: "64px",
  xl: "80px",
};

const UserAvatar = memo(({
  avatarUrl,
  size = "md",
  className = "",
  name,
}: UserAvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LOGIC QUAN TRỌNG: Loại bỏ hoàn toàn việc tìm default-avatar.png
  const isValidUrl = useMemo(() => {
    if (!avatarUrl || typeof avatarUrl !== "string") return false;
    
    // Nếu link chứa 'default-avatar' hoặc rỗng thì coi như không có ảnh
    const isDefaultPath = avatarUrl.includes("default-avatar");
    if (isDefaultPath || avatarUrl.trim() === "") return false;

    return avatarUrl.startsWith("http") || avatarUrl.startsWith("/");
  }, [avatarUrl]);

  const initials = useMemo(() => {
    if (!name) return null;
    return name.trim().charAt(0).toUpperCase();
  }, [name]);

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden border border-gray-100 bg-gray-200 flex items-center justify-center ${
        sizeMap[size]
      } ${className}`}
    >
      {isValidUrl && !imgError ? (
        <Image
          src={avatarUrl as string}
          alt={name || "User avatar"}
          fill
          sizes={sizesMapQuery[size]}
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-orange-50 text-[#ff4500] select-none">
          {initials ? (
            <span className="font-bold" style={{ fontSize: "1.2rem" }}>
              {initials}
            </span>
          ) : (
            <UserIcon size="60%" strokeWidth={2.5} />
          )}
        </div>
      )}
    </div>
  );
});

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;