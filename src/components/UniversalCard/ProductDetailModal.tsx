"use client";

import { useProductStore } from "@/lib/Zustard/store/useProductStore";
import { AnimatePresence, motion } from "framer-motion";
import { 
  X, Send, MessageSquare, Lock, 
  Edit2, Trash2, Check, RotateCcw, Flag 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/components/UniversalCard/types/type";
import { parseDbDate } from "@/lib/datetime";
import { createComment } from "@/app/actions/Comment/CommentActions";
import { updateComment } from "@/app/actions/Comment/UpdateComment";
import { deleteComment } from "@/app/actions/Comment/DeleteComment";
import { reportComment } from "@/app/actions/Comment/ReportComment"; 
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { createClient } from "@/lib/supabase/client";

// --- Interfaces ---
export interface CommentUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: CommentUser;
  is_deleted?: boolean;
  user_id?: string;
}

// Dữ liệu thô trả về từ Supabase trước khi chuẩn hoá
interface RawCommentUser {
  id?: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface RawComment {
  id: string;
  content: string;
  created_at: string | null;
  user?: RawCommentUser | RawCommentUser[] | null;
  user_id?: string | null;
}

interface ProductDetailModalProps {
  allProducts: Product[];
  currentUser: CommentUser | null;
}

const resolveImageUrl = (imagesData: unknown): string => {
  const fallback = "/placeholder.png";
  if (!imagesData || imagesData === "" || imagesData === "null") return fallback;
  try {
    if (Array.isArray(imagesData)) return (imagesData[0] as string) || fallback;
    if (typeof imagesData === "string" && imagesData.trim().startsWith("[")) {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? ((parsed[0] as string) || fallback) : parsed;
    }
    return typeof imagesData === "string" ? imagesData : fallback;
  } catch {
    return fallback;
  }
};

// Chuẩn hóa dữ liệu comment trả về từ Supabase (đề phòng "user" là mảng thay vì object)
const normalizeComment = (raw: RawComment): Comment => {
  const userData = Array.isArray(raw.user) ? raw.user[0] : raw.user;
  return {
    id: raw.id,
    content: raw.content,
    created_at: raw.created_at ?? "",
    user: {
      id: userData?.id ?? "",
      username: userData?.username ?? "",
      avatar_url: userData?.avatar_url ?? null,
    },
  };
};

// --- Sub-component: CommentItem ---
const CommentItem = React.memo(({ 
  comment, 
  currentUser,
  onDelete,
  onUpdate,
  closeDetail,
  setItemRef,
  isHighlighted
}: { 
  comment: Comment; 
  currentUser: CommentUser | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  closeDetail: () => void;
  setItemRef: (id: string, el: HTMLDivElement | null) => void;
  isHighlighted: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    const authorId = comment.user?.id || comment.user_id;
    return String(currentUser.id) === String(authorId);
  }, [currentUser, comment]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== comment.content) {
      onUpdate(comment.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleReport = async () => {
    if (isOwner) return; 
    const reason = window.prompt("Lý do tố cáo bình luận này (Spam, xúc phạm...)?");
    if (!reason || !reason.trim()) return;

    try {
      await reportComment(comment.id, reason);
      alert("Cảm ơn bạn! Chúng tôi đã nhận được báo cáo.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể gửi tố cáo.");
    }
  };

  // Tránh lỗi đường dẫn ảnh đại diện Google hoặc ảnh trống từ hệ thống
  const safeAvatarSrc = useMemo(() => {
    const rawUrl = comment.user?.avatar_url;
    if (rawUrl && rawUrl.trim() !== "" && !rawUrl.includes("googleusercontent.com/profile/picture/0")) {
      return rawUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.username || 'User')}&background=random`;
  }, [comment.user]);

  return (
    <div 
      ref={(el) => setItemRef(comment.id, el)}
      className={`flex gap-3 group items-start animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-2xl ${
        isHighlighted ? "comment-highlight-blink" : ""
      }`}
    >
      <Link
        href={`/profile/${comment.user?.id || comment.user_id}`}
        onClick={closeDetail}
        className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 relative border shadow-sm mt-0.5 cursor-pointer"
        style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}
      >
        {/* ĐÃ SỬA: Thay thế bằng thẻ img thuần để chặn đứng lỗi tối ưu hóa ảnh Next.js 400 Bad Request */}
        <Image
          src={safeAvatarSrc}
          alt="Avatar"
          fill
          sizes="36px"
          className="object-cover"
        />
      </Link>

      <div 
        className="flex-1 rounded-2xl px-4 py-3 border relative transition-colors"
        style={{ 
          backgroundColor: 'rgba(var(--border-main), 0.03)',
          borderColor: 'rgba(var(--border-main), 0.08)' 
        }}
      >
        <div className="flex justify-between items-center mb-1">
          <Link
            href={`/profile/${comment.user?.id || comment.user_id}`}
            onClick={closeDetail}
            className="text-base hover:opacity-70 transition-opacity uppercase font-normal cursor-pointer"
            style={{ color: 'rgb(var(--text-main))' }}
          >
            {comment.user?.username || "Thành viên"}
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
              {parseDbDate(comment.created_at)?.toLocaleDateString("vi-VN") ?? ""}
            </span>
            
            <div className="flex gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
              {isOwner ? (
                <>
                  {!isEditing && (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                        style={{ color: 'rgb(var(--text-muted))' }}
                        title="Sửa"
                      >
                        <span className="cursor-pointer"><Edit2 size={14} /></span>
                      </button>
                      <button 
                        onClick={() => onDelete(comment.id)} 
                        className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                        style={{ color: 'rgb(var(--text-muted))' }}
                        title="Xóa"
                      >
                        <span className="cursor-pointer"><Trash2 size={14} /></span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                currentUser && (
                  <button 
                    onClick={handleReport}
                    className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
                    style={{ color: 'rgb(var(--text-muted))' }}
                    title="Tố cáo"
                  >
                    <span className="cursor-pointer"><Flag size={14} /></span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full text-sm rounded-lg p-2 outline-none focus:ring-1 focus:ring-black/20 font-normal min-h-[60px]"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))',
                borderColor: 'rgba(var(--border-main), 0.2)',
                color: 'rgb(var(--text-main))'
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setIsEditing(false); setEditValue(comment.content); }} className="p-1.5 text-gray-400 hover:bg-black/5 rounded-md cursor-pointer">
                <RotateCcw size={16} />
              </button>
              <button onClick={handleSave} className="p-1.5 text-black hover:bg-black/5 rounded-md cursor-pointer">
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed break-words font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
});
CommentItem.displayName = "CommentItem";

// --- Main Component ---
export const ProductDetailModal = ({ allProducts, currentUser }: ProductDetailModalProps) => {
  const { isModalOpen, activeProductId, activeCommentId, closeDetail, addOptimisticComment, commentsData, setProductComments } = useProductStore();
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const supabase = createClient();

  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    commentRefs.current[id] = el;
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isModalOpen]);

  const product = useMemo(() =>
    allProducts.find((p) => p.id === activeProductId) as (Product & { comments?: Comment[], user_id: string }) | undefined,
    [allProducts, activeProductId]
  );

  const mainImage = useMemo(() => resolveImageUrl(product?.images), [product?.images]);

  // --- LUÔN TẢI LẠI BÌNH LUẬN MỚI NHẤT MỖI KHI MỞ MODAL ---
  // Đảm bảo bình luận vừa được tạo (kể cả từ người khác) luôn có mặt để cuộn/nháy tới
  useEffect(() => {
    if (!isModalOpen || !product) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .eq("product_id", product.id)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) {
        setProductComments(product.id, data.map(normalizeComment));
      }
    })();

    return () => { cancelled = true; };
    // Chỉ phụ thuộc product?.id (không phải cả object product) để tránh fetch lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, product?.id, supabase, setProductComments]);

  const currentComments = useMemo((): Comment[] => {
    if (!activeProductId || !product) return [];
    const initialComments: Comment[] = product.comments || [];
    const storeComments = (commentsData[activeProductId] as Comment[]) || [];
    const combined = [...initialComments, ...storeComments];
    
    return Array.from(new Map(combined.map(c => [c.id, c])).values())
      .filter(c => !c.is_deleted)
      .sort((a, b) => (parseDbDate(a.created_at)?.getTime() ?? 0) - (parseDbDate(b.created_at)?.getTime() ?? 0));
  }, [product, activeProductId, commentsData]);

  // --- CUỘN TỚI & NHÁY HIỆU ỨNG BÌNH LUẬN KHI MỞ TỪ THÔNG BÁO ---
  // Kiên nhẫn thử lại nhiều lần vì bình luận có thể vừa tải xong sau modal
  useEffect(() => {
    if (!isModalOpen || !activeCommentId) return;

    const targetId = activeCommentId;
    let attempts = 0;
    let rafId: number;
    let blinkTimeoutId: ReturnType<typeof setTimeout>;

    const tryScrollAndBlink = () => {
      const el = commentRefs.current[targetId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedId(targetId);
        blinkTimeoutId = setTimeout(() => setHighlightedId(null), 1500);
        return;
      }
      attempts += 1;
      if (attempts < 60) {
        rafId = requestAnimationFrame(tryScrollAndBlink);
      }
    };

    const startTimeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(tryScrollAndBlink);
    }, 350);

    return () => {
      clearTimeout(startTimeoutId);
      clearTimeout(blinkTimeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isModalOpen, activeCommentId, currentComments]);

  const handleSendComment = useCallback(async () => {
    if (!currentUser || !commentInput.trim() || isSubmitting || !product) return;
    const contentToSend = commentInput.trim();
    setCommentInput("");
    setIsSubmitting(true);

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: contentToSend,
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    addOptimisticComment(product.id, optimisticComment);

    try {
      const res = await createComment(product.id, contentToSend);
      
      if (!res.success) {
        alert(`Lỗi: ${res.error || "Không thể lưu bình luận vào hệ thống."}`);
        
        // Hoàn tác dữ liệu ảo nếu lỗi
        useProductStore.setState((state) => ({
          commentsData: {
            ...state.commentsData,
            [product.id]: (state.commentsData[product.id] || []).filter(c => c.id !== optimisticComment.id)
          }
        }));
        return;
      }

      // Thay thế comment tạm thời bằng comment thật từ database trả về để đồng bộ ID thật
      if (res.success && res.data) {
        useProductStore.setState((state) => ({
          commentsData: {
            ...state.commentsData,
            [product.id]: (state.commentsData[product.id] || []).map(c => 
              c.id === optimisticComment.id ? normalizeComment(res.data) : c
            )
          }
        }));
      }

      // Thông báo cho chủ sản phẩm được xử lý tự động qua trigger SQL "handle_new_comment"
      // khi bình luận được insert vào bảng comments — không cần insert notification thủ công ở đây nữa.
    } catch (error) {
      console.error("❌ Lỗi hệ thống:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [commentInput, isSubmitting, product, addOptimisticComment, currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có muốn xóa thảo luận này?")) return;
    const originalComments = [...(commentsData[product?.id ?? ""] || [])];
    useProductStore.setState((state) => ({
        commentsData: {
            ...state.commentsData,
            [product!.id]: (state.commentsData[product!.id] || []).map(c => 
                c.id === id ? { ...c, is_deleted: true } : c
            )
        }
    }));
    try { await deleteComment(id); } catch {
      useProductStore.setState((state) => ({
        commentsData: { ...state.commentsData, [product!.id]: originalComments }
      }));
    }
  };

  const handleUpdate = async (id: string, content: string) => {
    useProductStore.setState((state) => ({
        commentsData: {
            ...state.commentsData,
            [product!.id]: (state.commentsData[product!.id] || []).map(c => 
                c.id === id ? { ...c, content } : c
            )
        }
    }));
    try { await updateComment(id, content); } catch (e) { console.error(e); }
  };

  if (!mounted || !product) return null;
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <>
      <style jsx global>{`
        @keyframes commentHighlightBlink {
          0%, 100% {
            background-color: transparent;
            box-shadow: none;
          }
          20%, 60% {
            background-color: rgba(249, 115, 22, 0.14);
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.7);
          }
          40%, 80% {
            background-color: transparent;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.25);
          }
        }
        .comment-highlight-blink {
          animation: commentHighlightBlink 0.6s ease-in-out 2;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-6"
            onClick={closeDetail}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeDetail(); }}
              className="fixed top-4 left-4 md:top-8 md:left-8 z-[100000] p-4 rounded-full text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X size={32} />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl h-full md:h-[90vh] md:rounded-[3rem] flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
              style={{ backgroundColor: 'rgb(var(--bg-card))' }}
            >
              {/* Ảnh sản phẩm bên trái */}
              <div 
                className="w-full h-[40%] md:h-full md:w-3/5 relative flex items-center justify-center border-b md:border-b-0 md:border-r"
                style={{ backgroundColor: 'rgba(var(--border-main), 0.05)', borderColor: 'rgba(var(--border-main), 0.1)' }}
              >
                <div className="relative w-full h-full p-6 md:p-12">
                  <Image 
                    src={mainImage} 
                    alt={product.title} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-contain drop-shadow-2xl" 
                    priority 
                  />
                </div>
              </div>

              {/* Chi tiết & Bình luận bên phải */}
              <div className="w-full h-[60%] md:h-full md:w-2/5 flex flex-col overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-card))' }}>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar">
                  <div className="space-y-4">
                    <Link href={`/profile/${product.user_id}`} onClick={closeDetail} className="flex items-center gap-3 group w-fit cursor-pointer">
                      <UserAvatar avatarUrl={product.avatar_url} />
                      <span className="text-base uppercase group-hover:opacity-70 transition-opacity font-normal" style={{ color: 'rgb(var(--text-main))' }}>
                        {product.author || "Thành viên"}
                      </span>
                    </Link>
                    <div className="space-y-1">
                      <Link href={`/communities/${product.community_id}`} onClick={closeDetail} className="text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity font-normal cursor-pointer" style={{ color: 'rgb(var(--text-main))' }}>
                        ● {product.communityName || "Cộng đồng"}
                      </Link>
                      <h2 className="text-2xl leading-tight uppercase font-normal" style={{ color: 'rgb(var(--text-main))' }}>
                        {product.title}
                      </h2>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(var(--border-main), 0.1)' }} />

                  <section>
                    <label className="text-xs uppercase flex items-center gap-2 mb-6 tracking-widest font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
                      <MessageSquare size={16} /> Thảo luận ({currentComments.length})
                    </label>
                    <div className="space-y-5">
                      {currentComments.length > 0 ? (
                        currentComments.map((comment) => (
                          <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            currentUser={currentUser}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                            closeDetail={closeDetail}
                            setItemRef={setItemRef}
                            isHighlighted={highlightedId === comment.id}
                          />
                        ))
                      ) : (
                        <p className="text-center py-10 text-xs uppercase font-normal" style={{ color: 'rgb(var(--text-muted))' }}>Chưa có thảo luận nào</p>
                      )}
                      <div ref={commentsEndRef} />
                    </div>
                  </section>
                </div>

                {/* Ô nhập bình luận */}
                <div className="p-6 md:p-8 border-t" style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}>
                  <div 
                    className={`flex gap-2 p-1.5 rounded-[1.8rem] border transition-all ${
                      currentUser ? "focus-within:ring-1 focus-within:ring-black/10" : "opacity-80"
                    }`}
                    style={{ backgroundColor: 'rgba(var(--border-main), 0.05)', borderColor: 'rgba(var(--border-main), 0.1)' }}
                  >
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                      placeholder={!currentUser ? "Đăng nhập để thảo luận..." : "Viết thảo luận..."}
                      className={`flex-1 bg-transparent px-4 py-2 text-sm outline-none font-normal ${!currentUser ? "cursor-not-allowed" : "cursor-text"}`}
                      style={{ color: 'rgb(var(--text-main))' }}
                      disabled={isSubmitting || !currentUser}
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!commentInput.trim() || isSubmitting || !currentUser}
                      className={`p-3 rounded-full transition-all flex items-center justify-center ${
                        currentUser && commentInput.trim() ? "hover:bg-black/5 cursor-pointer" : "cursor-default"
                      }`}
                      style={{ 
                        backgroundColor: 'transparent', 
                        color: 'rgb(var(--text-main))' 
                      }}
                    >
                      {currentUser ? <Send size={20} className="cursor-pointer" /> : <Lock size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    modalRoot
  );
};