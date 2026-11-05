"use client";

import React, { useState, useMemo } from "react";
import { Star, MessageSquarePlus, X, Loader2, Users, Zap, Heart, ShieldCheck, Quote, Sparkles, TrendingUp, Filter, ThumbsUp, CheckCircle2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { parseDbDate } from "@/lib/datetime";
import { RatingStats } from "@/components/profile/hooks/useProfileData"; 
import Link from "next/link"; 

type Props = { 
  reviewedUserId: string;
  data: RatingStats; 
};

const STAR_COLOR = "#FFB300";

export default function UserRating({ reviewedUserId, data }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [tempRating, setTempRating] = useState(0);
  const [showAll, setShowAll] = useState(false);
  
  const [filter, setFilter] = useState<"all" | "high" | "comment">("all");

  const myReview = data.reviews?.find((r) => r.reviewer_id === currentUserId);

  const getRatingPercent = (star: number) => {
    if (!data.reviews || data.reviews.length === 0) return 0;
    const count = data.reviews.filter(r => r.rating === star).length;
    return (count / data.reviews.length) * 100;
  };

  const recommendationRate = useMemo(() => {
    if (!data.reviews || data.reviews.length === 0) return 0;
    const positive = data.reviews.filter(r => r.rating >= 4).length;
    return Math.round((positive / data.reviews.length) * 100);
  }, [data.reviews]);

  const { mutate: submitRating, isPending } = useMutation({
    mutationFn: async ({ star, comment }: { star: number; comment: string }) => {
      if (!currentUserId) throw new Error("Bạn cần đăng nhập");

      const { error } = await supabase
        .from("user_ratings")
        .upsert(
          {
            reviewer_id: currentUserId,
            reviewed_user_id: reviewedUserId,
            rating: star,
            comment: comment.trim() || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "reviewer_id,reviewed_user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", reviewedUserId] });
      setIsEditing(false);
      setHover(0);
    },
    onError: (err: Error) => {
      alert(`Không thể lưu đánh giá: ${err.message}`);
    }
  });

  const processedReviews = useMemo(() => {
    let list = data.reviews || [];
    if (filter === "high") list = list.filter(r => r.rating >= 4);
    if (filter === "comment") list = list.filter(r => r.comment && r.comment.length > 0);
    return showAll ? list : list.slice(0, 3);
  }, [data.reviews, filter, showAll]);

  return (
    <div className="w-full space-y-5 transition-colors duration-300" style={{ color: 'rgb(var(--text-main))' }}>
      {/* --- SECTION 1: OVERVIEW --- */}
      <div 
        className="group/main py-6 px-5 rounded-[2rem] border shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-md"
        style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
      >
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="text-center md:px-6 md:border-r min-w-[140px]" style={{ borderColor: 'rgba(var(--border-main), 0.3)' }}>
            <div className="relative inline-block group/score">
                <span className="text-5xl font-normal tracking-tighter" style={{ color: 'rgb(var(--text-main))' }}>
                    {data.avgRating > 0 ? data.avgRating.toFixed(1) : "0"}
                </span>
                <Sparkles className="absolute -top-1 -right-4 text-orange-400 animate-pulse" size={16} />
            </div>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={data.avgRating >= s ? STAR_COLOR : "none"}
                  style={{ color: data.avgRating >= s ? STAR_COLOR : 'rgba(var(--text-muted), 0.2)' }}
                />
              ))}
            </div>
            <p className="text-[10px] font-normal uppercase tracking-widest mt-2" style={{ color: 'rgb(var(--text-muted))' }}>Tin cậy</p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 shadow-sm">
                <ThumbsUp size={11} />
                <span className="text-[10px] font-normal uppercase">{recommendationRate}% Khuyên dùng</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3 group/bar cursor-default">
                <span className="text-xs font-normal w-2" style={{ color: 'rgb(var(--text-muted))' }}>{star}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden relative shadow-inner" style={{ backgroundColor: 'rgba(var(--border-main), 0.2)' }}>
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${getRatingPercent(star)}%` }}
                  />
                </div>
                <span className="text-[10px] font-normal w-8 text-right" style={{ color: 'rgb(var(--text-muted))' }}>{Math.round(getRatingPercent(star))}%</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:flex md:flex-col gap-2 w-full md:w-auto">
            <div 
              className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm transition-all group/badge"
              style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
            >
              <div className="p-2 rounded-lg shadow-sm text-purple-600" style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }}>
                <Users size={16} />
              </div>
              <div>
                <p className="text-base font-normal leading-none" style={{ color: 'rgb(var(--text-main))' }}>{data.totalReviews ?? 0}</p>
                <p className="text-[9px] font-normal uppercase tracking-tight mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Đánh giá</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-blue-500/10 px-4 py-3 rounded-xl border border-blue-500/20 transition-all group/badge">
              <div className="p-2 bg-white/10 rounded-lg shadow-sm text-blue-500">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-base font-normal leading-none text-blue-600">
                    {data.avgRating >= 4.0 ? "Uy Tín" : "Tích Cực"}
                </p>
                <p className="text-[9px] text-blue-500 font-normal uppercase tracking-tight mt-0.5">Trạng thái</p>
              </div>
            </div>
          </div>
        </div>

        {currentUserId && currentUserId !== reviewedUserId && !isEditing && (
          <div className="mt-6 pt-5 border-t border-dashed flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(var(--border-main), 0.3)' }}>
            <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2 overflow-hidden">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 bg-slate-100 flex items-center justify-center shadow-sm" style={{ borderColor: 'rgb(var(--bg-card))' }}>
                            <Users size={10} className="text-slate-400" />
                        </div>
                    ))}
                </div>
                <span className="text-xs font-normal italic" style={{ color: 'rgb(var(--text-muted))' }}>Chia sẻ cảm nhận của bạn...</span>
            </div>
            <button
              onClick={() => {
                setTempRating(myReview?.rating || 5);
                setCommentInput(myReview?.comment || "");
                setIsEditing(true);
              }}
              className="w-full sm:w-auto relative group/btn flex items-center justify-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-[11px] font-normal uppercase tracking-wider transition-all active:scale-95 shadow-lg overflow-hidden cursor-pointer"
            >
              <MessageSquarePlus size={15} className="relative z-10" />
              <span className="relative z-10">{myReview ? "Sửa đánh giá" : "Viết đánh giá ngay"}</span>
            </button>
          </div>
        )}
      </div>

      {/* --- SECTION 2: EDIT FORM --- */}
      {isEditing && (
        <div 
          className="rounded-[1.8rem] p-6 shadow-xl border animate-in slide-in-from-top-4 duration-500"
          style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.5)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                <h3 className="text-sm font-normal uppercase tracking-widest" style={{ color: 'rgb(var(--text-main))' }}>Đánh giá người dùng</h3>
            </div>
            <button 
              onClick={() => setIsEditing(false)} 
              className="p-1.5 rounded-full transition-all shadow-sm hover:bg-slate-500/10 cursor-pointer"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <X size={18} />
            </button>
          </div>
          <div 
            className="flex flex-col items-center gap-3 mb-6 py-6 rounded-2xl border transition-colors duration-300"
            style={{ backgroundColor: 'rgba(var(--border-main), 0.1)', borderColor: 'rgba(var(--border-main), 0.2)' }}
          >
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onMouseEnter={() => setHover(s)} 
                    onMouseLeave={() => setHover(0)} 
                    onClick={() => setTempRating(s)} 
                    className="p-1 transition-all hover:scale-110 cursor-pointer"
                  >
                    <Star 
                      size={36} 
                      fill={(hover || tempRating) >= s ? STAR_COLOR : "none"} 
                      style={{ color: (hover || tempRating) >= s ? STAR_COLOR : 'rgba(var(--text-muted), 0.3)' }} 
                      strokeWidth={1.5}
                      className={`transition-all duration-300 ${tempRating === s ? "scale-110" : ""}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-normal text-purple-600 uppercase tracking-widest h-4">
                {tempRating === 5 ? "Rất hài lòng" : tempRating === 4 ? "Hài lòng" : tempRating === 3 ? "Tạm được" : tempRating > 0 ? "Không hài lòng" : "Chọn số sao"}
              </p>
          </div>
          <div className="relative">
              <Quote className="absolute -top-4 -left-2 text-purple-600/10 pointer-events-none" size={40} />
              <textarea 
                value={commentInput} 
                onChange={(e) => setCommentInput(e.target.value)} 
                placeholder="Nhập nhận xét của bạn tại đây..." 
                className="w-full min-h-[110px] border focus:border-purple-600 rounded-2xl p-4 text-sm outline-none transition-all shadow-sm bg-transparent font-normal"
                style={{ 
                  borderColor: 'rgba(var(--border-main), 0.3)', 
                  color: 'rgb(var(--text-main))'
                }} 
              />
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button 
              onClick={() => setIsEditing(false)} 
              className="px-5 py-2 font-normal uppercase text-[10px] hover:text-purple-600 transition-colors cursor-pointer"
              style={{ color: 'rgb(var(--text-muted))' }}
            >Hủy</button>
            <button 
              onClick={() => submitRating({ star: tempRating, comment: commentInput })} 
              disabled={isPending || tempRating === 0} 
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-normal uppercase tracking-widest disabled:opacity-40 shadow-md transition-all hover:bg-purple-700 cursor-pointer"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} fill="currentColor" />} 
              Gửi ngay
            </button>
          </div>
        </div>
      )}

      {/* --- SECTION 3: REVIEWS LIST --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-600" />
                <h4 className="font-normal uppercase tracking-widest text-[10px]" style={{ color: 'rgb(var(--text-muted))' }}>Phản hồi từ cộng đồng</h4>
            </div>
            <div 
              className="flex p-1 rounded-lg border transition-colors duration-300"
              style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
            >
                {([
                    { id: "all", label: "Tất cả", icon: Filter },
                    { id: "high", label: "5 Sao", icon: Star }
                ] as const).map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-normal uppercase transition-all cursor-pointer ${
                            filter === btn.id 
                            ? "bg-slate-500/10 text-purple-600 shadow-sm" 
                            : ""
                        }`}
                        style={filter !== btn.id ? { color: 'rgb(var(--text-muted))' } : {}}
                    >
                        <btn.icon size={11} />
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>

        {processedReviews.length === 0 ? (
          <div 
            className="py-12 text-center rounded-[2rem] border border-dashed shadow-sm"
            style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
          >
            <Heart size={30} className="mx-auto mb-2 opacity-20" />
            <p className="font-normal uppercase tracking-widest text-[10px]" style={{ color: 'rgb(var(--text-muted))' }}>Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {processedReviews.map((r, index) => (
              <div 
                key={r.id} 
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  backgroundColor: 'rgb(var(--bg-card))',
                  borderColor: 'rgba(var(--border-main), 0.3)'
                }}
                className="group/item border p-4 rounded-[1.5rem] flex flex-col sm:flex-row gap-4 items-start transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 shadow-sm"
              >
                <div className="relative shrink-0">
                  <Link href={`/profile/${r.user?.id || r.reviewer_id}`} className="block transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                    <UserAvatar avatarUrl={r.user?.avatar_url || ""} size="md" />
                    {r.rating === 5 && (
                        <div className="absolute -bottom-1.5 -right-1.5 bg-orange-400 text-white p-1 rounded-full border-2 transition-colors duration-300" 
                             style={{ borderColor: 'rgb(var(--bg-card))' }}>
                            <Sparkles size={10} fill="currentColor" />
                        </div>
                    )}
                  </Link>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="space-y-0.5">
                        <Link href={`/profile/${r.user?.id || r.reviewer_id}`} className="inline-block cursor-pointer">
                          <p className="font-normal text-sm hover:text-purple-600 transition-colors" style={{ color: 'rgb(var(--text-main))' }}>
                              {r.user?.username ? `${r.user.username}` : (r.user ? "Người dùng ẩn danh" : "Người dùng đã bị xóa")}
                          </p>
                        </Link>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={11} fill={r.rating >= s ? STAR_COLOR : "none"} style={{ color: r.rating >= s ? STAR_COLOR : 'rgba(var(--text-muted), 0.2)' }} />
                            ))}
                        </div>
                    </div>
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit"
                      style={{ backgroundColor: 'rgba(var(--border-main), 0.1)', borderColor: 'rgba(var(--border-main), 0.2)' }}
                    >
                        <CheckCircle2 size={12} className="text-green-600" />
                        <span className="text-[9px] font-normal uppercase tracking-tight" style={{ color: 'rgb(var(--text-muted))' }}>
                            {(() => { const d = parseDbDate(r.created_at); return d ? formatDistanceToNow(d, { locale: vi, addSuffix: true }) : ""; })()}
                        </span>
                    </div>
                  </div>
                  <div 
                    className="p-3 rounded-xl border"
                    style={{ backgroundColor: 'rgba(var(--border-main), 0.05)', borderColor: 'rgba(var(--border-main), 0.1)' }}
                  >
                      <p className="text-xs leading-relaxed font-normal italic" style={{ color: 'rgb(var(--text-main))' }}>
                        {`"${r.comment || "Người dùng không để lại nhận xét..."}"`}
                      </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {data.totalReviews > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)} 
            className="group/more w-full py-4 text-[10px] font-normal text-purple-600 uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            style={{ backgroundColor: 'rgb(var(--bg-card))' }}
          >
            {showAll ? "Thu gọn" : `Xem thêm ${data.totalReviews - 3} nhận xét`}
            <ChevronDown size={16} className={`${showAll ? "rotate-180" : "animate-bounce"} transition-transform`} />
          </button>
        )}
      </div>
    </div>
  );
}