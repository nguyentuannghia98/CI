"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Share2, MessageCircle, Heart, ShieldCheck, 
  Trophy, Flag, Pencil, MoreHorizontal, Shield, AlertTriangle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link"; 
import { useProductStore } from "@/lib/Zustard/store/useProductStore"; 
import { getSafeImageUrl } from "@/utils/image-helper";
import { ReportModal } from "@/components/UniversalCard/components/ReportModal";
import { EditProductModal } from "@/components/UniversalCard/components/EditProductModal";
import { UniversalCardProps } from "./types/type";
import { useCardActions } from "./types/useCardActions";

const confettiColors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
const particles = Array.from({ length: 12 });
const EMPTY_ARRAY: never[] = [];

const UniversalCard = memo(({
  product, viewMode = "grid", onDelete, onEdit, onTagClick, priority = false,
}: UniversalCardProps & { priority?: boolean }) => {
  
  const { state, setters, logic } = useCardActions(product, onDelete, onEdit);

  // Zustand Data Selectors
  const commentsCount = useProductStore((s) => s.commentsCount[product.id] ?? product.comments_count);
  const productComments = useProductStore((s) => s.commentsData[product.id]) ?? EMPTY_ARRAY;

  const isGrid = viewMode === "grid";
  const displayImage = getSafeImageUrl(
    Array.isArray(product.images) 
      ? product.images[0] 
      : (product.images || product.image_url), 
    "/placeholder.png"
  );
  const avatarImage = getSafeImageUrl(product.avatar_url, "/default-avatar.png");

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10, pointerEvents: "none" as const },
    visible: { opacity: 1, scale: 1, y: 0, pointerEvents: "auto" as const }
  };

  // Component nút Menu để tái sử dụng (gọi như hàm để tránh remount)
  const renderMenuButton = () => (
    <div className="relative">
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setters.setShowUserMenu(!state.showUserMenu); 
          setters.setShowModMenu(false); 
        }}
        aria-label="Tuỳ chọn bài viết"
        aria-haspopup="menu"
        aria-expanded={state.showUserMenu}
        className={`p-2 rounded-full backdrop-blur-md border cursor-pointer transition-all ${
          state.showUserMenu 
            ? 'bg-orange-500 text-white border-orange-500' 
            : 'hover:scale-110 active:scale-95'
        }`}
        style={{ 
          backgroundColor: !state.showUserMenu ? 'rgba(var(--border-main), 0.05)' : undefined,
          borderColor: !state.showUserMenu ? 'rgba(var(--border-main), 0.1)' : undefined,
          color: !state.showUserMenu ? 'rgb(var(--text-main))' : undefined
        }}
      >
        < MoreHorizontal size={18} strokeWidth={2.5} className="cursor-pointer" />
      </button>
      
      <AnimatePresence>
        {state.showUserMenu && (
          <motion.div 
            initial="hidden" animate="visible" exit="hidden" variants={menuVariants} 
            className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl border p-2 z-[110]" 
            style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {logic.permissions.isOwner ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setters.setIsEditOpen(true); setters.setShowUserMenu(false); }} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Pencil size={16} className="cursor-pointer" /> Chỉnh sửa bài
                </button>
                <button 
                  onClick={logic.handleDelete} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Trash2 size={16} className="cursor-pointer" /> Xóa bài viết
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setters.setIsReportOpen(true); setters.setShowUserMenu(false); }} 
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Flag size={16} className="cursor-pointer" /> Báo cáo bài viết
              </button>
            )}
            <button 
              onClick={logic.handleShare} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl text-xs font-bold border-t mt-1 cursor-pointer" 
              style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}
            >
              <Share2 size={16} className="cursor-pointer" /> {state.copied ? "Đã chép link" : "Chia sẻ link"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <motion.div
        layout
        transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 }
        }}
        className={`group relative border dark:border-transparent overflow-hidden ${
          state.isDeleting ? "opacity-40 grayscale pointer-events-none" : ""
        } ${isGrid 
            ? "flex flex-col rounded-[28px] p-3.5 w-full hover:border-orange-500 hover:shadow-xl" 
            : "flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-[32px] w-full min-w-0 md:min-w-[850px] md:h-[220px] hover:border-orange-500 hover:shadow-md"
        }`}
        style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
      >
        {/* --- MENU OVERLAYS --- */}
        {isGrid && (
          <div className="absolute inset-4 pointer-events-none z-[110]">
            <div className="absolute top-0 right-0 pointer-events-auto">
              {renderMenuButton()}
            </div>

            {logic.permissions.isMod && (
              <div className="absolute bottom-0 right-0 pointer-events-auto">
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setters.setShowModMenu(!state.showModMenu); setters.setShowUserMenu(false); }} 
                    aria-label="Công cụ kiểm duyệt"
                    aria-haspopup="menu"
                    aria-expanded={state.showModMenu}
                    className={`p-2 rounded-full backdrop-blur-md border cursor-pointer transition-all ${
                      state.showModMenu ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-500 border-white/10 hover:scale-110 active:scale-95'
                    }`}
                  >
                    <Shield size={18} strokeWidth={2.5} className="cursor-pointer" />
                  </button>
                  <AnimatePresence>
                    {state.showModMenu && (
                      <motion.div 
                        initial="hidden" animate="visible" exit="hidden" variants={menuVariants} 
                        className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl border p-2 z-[110]" 
                        style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
                      >
                        <div className="px-3 py-2 text-[10px] font-black uppercase text-purple-500 border-b mb-1" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
                          Quản trị {logic.currentUser?.role}
                        </div>
                        <button 
                          onClick={logic.handleDelete} 
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <Trash2 size={16} className="cursor-pointer" /> Gỡ bài (Vi phạm)
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setters.setIsReportOpen(true); }} 
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <AlertTriangle size={16} className="cursor-pointer" /> Nhắc nhở tác giả
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- IMAGE SECTION --- */}
        <motion.div 
          layout
          onClick={() => logic.openDetail(product.id)} 
          className={`relative flex-shrink-0 overflow-hidden rounded-[20px] cursor-zoom-in ${isGrid ? "w-full aspect-square mb-4" : "w-full md:w-auto md:h-full aspect-square mb-4 md:mb-0"}`} 
          style={{ backgroundColor: 'rgba(var(--border-main), 0.08)' }}
        >
          <Image 
            src={displayImage} alt={product.title} fill sizes={isGrid ? "320px" : "200px"} 
            priority={priority}
            className="object-cover transition-transform duration-[1500ms] group-hover:scale-110 cursor-zoom-in" 
          />
          {Array.isArray(product.images) && product.images.length > 1 && (
            <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg">
              +{product.images.length - 1}
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 z-10">
            {product.tags?.slice(0, 2).map((tag) => (
              <span 
                key={tag} 
                onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }} 
                className="text-[10px] font-black bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 hover:bg-orange-500 transition-colors pointer-events-auto cursor-pointer"
              >
                #{tag.toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>

        {/* --- CONTENT SECTION --- */}
        <motion.div layout className="flex flex-col flex-1 min-w-0 h-full py-1">
          {/* Author & Header Actions */}
          <div className="flex items-center justify-between gap-2 mb-2 h-8 flex-shrink-0">
            <Link href={`/profile/${product.user_id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 group/author cursor-pointer overflow-hidden">
              <div className="relative w-7 h-7 flex-shrink-0 cursor-pointer">
                <div className="absolute -inset-[2px] rounded-full bg-gradient-to-tr from-orange-600 to-amber-300 animate-spin duration-[3s]" />
                <div className="relative w-full h-full rounded-full p-[1.5px] bg-white dark:bg-zinc-900 overflow-hidden cursor-pointer">
                  <Image src={avatarImage} alt="avatar" fill sizes="28px" className="object-cover cursor-pointer" />
                </div>
              </div>
              <span className="text-[11px] truncate uppercase font-normal group-hover/author:text-orange-500 cursor-pointer" style={{ color: 'rgb(var(--text-main))' }}>
                {product.author}
              </span>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center justify-center cursor-pointer"><Trophy size={10} className="cursor-pointer" /></div>
                <div className="bg-orange-600 p-1 rounded-full text-white flex items-center justify-center cursor-pointer"><ShieldCheck size={10} className="cursor-pointer" /></div>
              </div>
              
              {/* Nút menu khi ở dạng ngang (List mode) */}
              {!isGrid && (
                <div className="flex items-center gap-2 pointer-events-auto">
                   {logic.permissions.isMod && (
                      <div className="relative">
                         <button 
                          onClick={(e) => { e.stopPropagation(); setters.setShowModMenu(!state.showModMenu); setters.setShowUserMenu(false); }} 
                          aria-label="Công cụ kiểm duyệt"
                          aria-haspopup="menu"
                          aria-expanded={state.showModMenu}
                          className={`p-2 rounded-full backdrop-blur-md border cursor-pointer transition-all ${
                            state.showModMenu ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-500 border-white/10 hover:scale-110 active:scale-95'
                          }`}
                        >
                          <Shield size={18} strokeWidth={2.5} className="cursor-pointer" />
                        </button>
                        <AnimatePresence>
                          {state.showModMenu && (
                            <motion.div 
                              initial="hidden" animate="visible" exit="hidden" variants={menuVariants} 
                              className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl border p-2 z-[110]" 
                              style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
                            >
                              <div className="px-3 py-2 text-[10px] font-black uppercase text-purple-500 border-b mb-1" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
                                Quản trị {logic.currentUser?.role}
                              </div>
                              <button 
                                onClick={logic.handleDelete} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                <Trash2 size={16} className="cursor-pointer" /> Gỡ bài (Vi phạm)
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setters.setIsReportOpen(true); }} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                <AlertTriangle size={16} className="cursor-pointer" /> Nhắc nhở tác giả
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                   )}
                   {renderMenuButton()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col justify-center">
            {!logic.isCommunityPage && (
              <Link 
                href={`/communities/${product.community_id}`} 
                onClick={(e) => e.stopPropagation()} 
                className="text-[10px] font-black uppercase tracking-widest mb-1 truncate hover:text-orange-500 cursor-pointer" 
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                ● {product.communityName || "Cộng đồng"}
              </Link>
            )}
            <h2 
              onClick={() => logic.openDetail(product.id)} 
              className="text-[17px] font-normal line-clamp-2 mb-2 hover:text-orange-500 cursor-pointer" 
              style={{ color: 'rgb(var(--text-main))' }}
            >
              {product.title}
            </h2>
            {productComments.length > 0 && (
              <motion.div layout className="space-y-1.5 p-2.5 rounded-[16px] border border-white/10" style={{ backgroundColor: 'rgba(var(--border-main), 0.05)' }}>
                {productComments.slice(0, isGrid ? 2 : 1).map((c) => (
                  <div key={c.id} className="flex gap-2 items-start cursor-pointer" onClick={() => logic.openDetail(product.id)}>
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border cursor-pointer" style={{ borderColor: 'rgb(var(--bg-card))' }}>
                      <Image src={getSafeImageUrl(c.user.avatar_url, "/default")} alt="avt" fill sizes="20px" className="object-cover cursor-pointer" />
                    </div>
                    <p className="text-[11px] line-clamp-1 cursor-pointer" style={{ color: 'rgb(var(--text-muted))' }}>
                      <span className="font-normal mr-1.5 uppercase text-[10px] cursor-pointer" style={{ color: 'rgb(var(--text-main))' }}>{c.user.username}</span>
                      {c.content}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div layout className="flex items-center justify-between border-t pt-3 mt-auto" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
            <div className="flex items-center gap-5">
              <div className="relative">
                <button 
                  onClick={logic.handleLikeToggle} 
                  aria-label={`Thích, ${state.localLikesCount} lượt thích`}
                  aria-pressed={state.localIsLiked}
                  className={`relative flex items-center gap-2 text-[14px] font-black transition-colors cursor-pointer ${state.localIsLiked ? "text-red-500" : "hover:text-red-500"}`} 
                  style={{ color: !state.localIsLiked ? 'rgb(var(--text-muted))' : undefined }}
                >
                  <div className="relative w-5 h-5 flex items-center justify-center cursor-pointer">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div 
                        key={state.localIsLiked ? "liked" : "unliked"} 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: [1, 1.4, 1], opacity: 1 }} 
                        exit={{ scale: 0.5, opacity: 0 }} 
                        transition={{ duration: 0.25 }}
                        className="cursor-pointer"
                      >
                        <Heart size={19} fill={state.localIsLiked ? "currentColor" : "none"} strokeWidth={3} className="cursor-pointer" />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <span className="tabular-nums cursor-pointer">{state.localLikesCount}</span>
                </button>
                <AnimatePresence>
                  {state.showConfetti && (
                    <div className="absolute left-2 top-0 pointer-events-none">
                      {particles.map((_, i) => (
                        <motion.span 
                          key={i} 
                          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }} 
                          animate={{ 
                            x: (Math.random() - 0.5) * 120, 
                            y: (Math.random() - 0.5) * 120, 
                            scale: 0, 
                            opacity: 0 
                          }} 
                          transition={{ duration: 0.5 }} 
                          className="absolute w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: confettiColors[i % 5] }} 
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); logic.openDetail(product.id); }} 
                aria-label={`Xem bình luận, ${commentsCount}`}
                className="flex items-center gap-2 text-[14px] font-black hover:text-orange-500 cursor-pointer" 
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                < MessageCircle size={19} strokeWidth={3} className="cursor-pointer" />
                <span className="cursor-pointer">{commentsCount}</span>
              </button>
            </div>
            {state.copied && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg"
              >
                Đã chép link!
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <ReportModal 
        isOpen={state.isReportOpen} 
        onClose={() => setters.setIsReportOpen(false)} 
        onSubmit={logic.handleReportSubmit} 
        communityName={product.communityName} 
        targetType="product" 
        isLoading={state.isReporting} 
      />
      <EditProductModal 
        isOpen={state.isEditOpen} 
        onClose={() => setters.setIsEditOpen(false)} 
        product={product} 
        onSuccess={logic.handleEditSubmit} 
        isLoading={state.isEditing} 
      />
      
      {(state.showUserMenu || state.showModMenu) && (
        <div 
          className="fixed inset-0 z-[100] cursor-default" 
          onClick={() => { setters.setShowUserMenu(false); setters.setShowModMenu(false); }} 
        />
      )}
    </>
  );
});

UniversalCard.displayName = "UniversalCard";
export default UniversalCard;