import { useState, useMemo, useCallback, useEffect } from "react";
import { useProductStore } from "@/lib/Zustard/store/useProductStore";
import { useUser } from "@/components/auth/store/AuthStore";
import { useCommunityStore } from "@/lib/Zustard/CommunityStore/CommunityStore";
import { toggleLikeAction } from "@/app/actions/LikeActions";
import { submitReportAction } from "@/app/actions/reportActions";
import { deleteProductAction } from "@/app/actions/deleteProductAction";
import { updateProductAction } from "@/app/actions/updateProductAction";
import { Product } from "@/components/UniversalCard/types/type";

export const useCardActions = (product: Product, onDelete?: (id: string) => void, onEdit?: (product: Product) => void) => {
  // --- States ---
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);

  // --- Zustand & Auth ---
  const openDetail = useProductStore((state) => state.openDetail);
  const toggleLike = useProductStore((state) => state.toggleLike);
  const currentUser = useUser();
  const isModFromStore = useCommunityStore((state) => state.isMod);
  const isCommunityPage = useCommunityStore((state) => state.isCommunityPage);

  // --- Like Stability Logic (Optimistic UI) ---
  const isLikedStore = useProductStore((state) => state.likedIds.includes(product.id));
  const likesCountStore = useProductStore((state) => state.likesCount[product.id] ?? product.upvotes);

  const [localIsLiked, setLocalIsLiked] = useState(isLikedStore);
  const [localLikesCount, setLocalLikesCount] = useState(likesCountStore);

  useEffect(() => {
    setLocalIsLiked(isLikedStore);
    setLocalLikesCount(likesCountStore);
  }, [isLikedStore, likesCountStore]);

  // --- Permissions ---
  const permissions = useMemo(() => {
    const userId = String(currentUser?.id || "").trim().toLowerCase();
    const ownerId = String(product.user_id || "").trim().toLowerCase();
    const hasModPower = currentUser?.role === "ADMIN" || (isCommunityPage && isModFromStore);
    return {
      isOwner: userId !== "" && userId === ownerId,
      isMod: !!hasModPower
    };
  }, [currentUser, product.user_id, isModFromStore, isCommunityPage]);

  // --- Handlers ---
  const checkAuth = useCallback(() => {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để thực hiện hành động này!");
      return false;
    }
    return true;
  }, [currentUser]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkAuth()) return;

    const previousLiked = localIsLiked;
    const newLikedStatus = !previousLiked;

    setLocalIsLiked(newLikedStatus);
    setLocalLikesCount(prev => newLikedStatus ? prev + 1 : prev - 1);
    toggleLike(product.id);

    if (newLikedStatus) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
    }

    try {
      const result = await toggleLikeAction(product.id);
      if (!result.success) throw new Error();
    } catch {
      setLocalIsLiked(previousLiked);
      setLocalLikesCount(prev => previousLiked ? prev + 1 : prev - 1);
      toggleLike(product.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Đã sửa thành URL dạng `/?product=ID` để trỏ về trang chủ kèm theo tham số sản phẩm
    navigator.clipboard.writeText(`${window.location.origin}/?product=${product.id}`);
    setCopied(true);
    setShowUserMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    setShowUserMenu(false);
    setShowModMenu(false);
    if (confirm("Xác nhận xóa bài viết? Thao tác này không thể hoàn tác.")) {
      try {
        setIsDeleting(true);
        const result = await deleteProductAction(product.id);
        if (result.success) onDelete?.(product.id);
        else alert(result.error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditSubmit = async (data: { title: string; description: string }) => {
    try {
      setIsEditing(true);
      const res = await updateProductAction(product.id, data);
      if (res.success) {
        onEdit?.({ ...product, ...data });
        setIsEditOpen(false);
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleReportSubmit = async (reason: string, details: string) => {
    if (!checkAuth()) return;
    try {
      setIsReporting(true);
      const res = await submitReportAction({ productId: product.id, reason, details, communityId: product.community_id });
      if (res.success) {
        alert("Đã gửi báo cáo!");
        setIsReportOpen(false);
      }
    } finally {
      setIsReporting(false);
    }
  };

  return {
    state: { copied, isReporting, isDeleting, isEditing, showConfetti, isReportOpen, isEditOpen, showUserMenu, showModMenu, localIsLiked, localLikesCount },
    setters: { setCopied, setIsReporting, setIsDeleting, setIsEditing, setShowConfetti, setIsReportOpen, setIsEditOpen, setShowUserMenu, setShowModMenu },
    logic: { permissions, currentUser, openDetail, handleLikeToggle, handleShare, handleDelete, handleEditSubmit, handleReportSubmit, checkAuth, isCommunityPage }
  };
};