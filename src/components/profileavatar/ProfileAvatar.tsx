"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";
import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { parseDbDate } from "@/lib/datetime";

type Props = {
  onUploaded: (url: string) => void;
  avatarUrl?: string | null;
  isOwner: boolean;
  username?: string | null;
  userIdFromProfile: string; 
};

export default function ProfileAvatar({
  onUploaded,
  avatarUrl,
  isOwner,
  username,
  userIdFromProfile,
}: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUser();
  
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const prevOnlineRef = useRef<boolean>(false);

  useEffect(() => {
    if (!userIdFromProfile) return;

    const getInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_online, last_seen")
          .eq("id", userIdFromProfile)
          .single();
        
        if (error) throw error;
        
        const isOnline = !!data?.is_online;
        setOnlineStatus(isOnline);
        setLastSeen(data?.last_seen || null);
        prevOnlineRef.current = isOnline;
      } catch (err) {
        console.error("❌ Lỗi lấy data ban đầu:", err);
      }
    };
    
    getInitialStatus();

    const channel = supabase
      .channel(`status-${userIdFromProfile}-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userIdFromProfile}`,
        },
        (payload) => {
          const newOnline = !!payload.new.is_online;
          
          if (prevOnlineRef.current === true && newOnline === false) {
            setLastSeen(new Date().toISOString());
          } else {
            setLastSeen(payload.new.last_seen || null);
          }

          setOnlineStatus(newOnline);
          prevOnlineRef.current = newOnline;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIdFromProfile, supabase]);

  useEffect(() => {
    setPreview(avatarUrl ?? null);
  }, [avatarUrl]);

  const formatOfflineTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = parseDbDate(dateString);
      if (!date) return "";
      const time = formatDistanceToNowStrict(date, {
        locale: vi,
        addSuffix: false,
      });

      return time
        .replace(" phút", "p")
        .replace(" giờ", "h")
        .replace(" ngày", "ng")
        .replace(" giây", "s");
    } catch {
      return "";
    }
  };

  const { mutate: uploadAvatar, isPending } = useMutation({
    mutationFn: async (file: File) => {
      if (!currentUserId) throw new Error("Vui lòng đăng nhập");
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-profile-avatar")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("user-profile-avatar").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", currentUserId);

      if (dbError) throw dbError;
      return publicUrl;
    },
    onSuccess: (newUrl) => {
      setPreview(newUrl);
      onUploaded(newUrl);
      queryClient.invalidateQueries({ queryKey: ["profile", userIdFromProfile] });
    },
    onError: (err: Error) => {
      alert("Lỗi tải ảnh: " + err.message);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      // Thu hồi blob URL sau khi upload xong (tránh leak)
      uploadAvatar(file, { onSettled: () => URL.revokeObjectURL(localUrl) });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 transition-colors duration-300">
      <div className="relative group">
        {/* Avatar Container */}
        <div 
          className={`
            relative w-32 h-32 rounded-full p-1 border-2 transition-all duration-300 shadow-lg
            ${isPending ? "animate-pulse" : "group-hover:border-orange-400"}
          `}
          style={{ 
            backgroundColor: 'rgb(var(--bg-card))', 
            borderColor: isPending ? 'rgb(var(--text-muted))' : 'rgba(var(--border-main), 0.3)' 
          }}
        >
          <div 
            className="w-full h-full rounded-full overflow-hidden relative"
            style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }}
          >
            {preview ? (
              <Image
                src={preview}
                alt={username || "Avatar"}
                fill
                className={`object-cover transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
                sizes="128px"
                priority
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center uppercase font-normal text-2xl"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                {username?.slice(0, 2) || "AV"}
              </div>
            )}
            
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Status Badge (Online/Offline) */}
        <div className="absolute bottom-1.5 right-1.5 z-30">
          {onlineStatus ? (
            <div className="relative flex h-6 w-6">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
              <span 
                className="relative inline-flex rounded-full h-6 w-6 border-[3.5px] shadow-md bg-green-500"
                style={{ borderColor: 'rgb(var(--bg-card))' }}
              ></span>
            </div>
          ) : (
            lastSeen && (
              <div 
                className="text-white text-[9px] font-normal px-1.5 py-0.5 rounded-full border-[2.5px] shadow-md flex items-center justify-center min-w-[22px] animate-in fade-in zoom-in duration-300 bg-slate-500"
                style={{ borderColor: 'rgb(var(--bg-card))' }}
              >
                {formatOfflineTime(lastSeen)}
              </div>
            )
          )}
        </div>

        {/* Camera Upload Button */}
        {isOwner && (
          <>
            <input id="avatarInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isPending} />
            <label
              htmlFor="avatarInput"
              className={`
                absolute top-0 right-0 p-2 rounded-full shadow-xl cursor-pointer 
                transition-all duration-200 active:scale-90 z-40 border
                ${isPending ? "cursor-not-allowed opacity-50" : "hover:scale-110 hover:border-orange-400"}
              `}
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))', 
                borderColor: 'rgba(var(--border-main), 0.3)',
                color: 'rgb(var(--text-main))'
              }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </label>
          </>
        )}
      </div>

      {/* Username Display */}
      {username && (
        <div className="max-w-[250px] px-2 text-center">
          <h2 
            className="text-2xl font-normal leading-tight break-words drop-shadow-sm transition-colors duration-300"
            style={{ color: 'rgb(var(--text-main))' }}
          >
            {username}
          </h2>
        </div>
      )}
    </div>
  );
}