import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Product } from "@/components/UniversalCard/types/type";

// Định nghĩa Comment đồng bộ với UI
export interface Comment {
  id: string;
  user_id?: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface ProductState {
  // --- DANH SÁCH SẢN PHẨM ---
  products: Product[];
  
  // --- METADATA TƯƠNG TÁC ---
  likedIds: string[];
  likesCount: Record<string, number>;
  commentsCount: Record<string, number>;
  
  // --- CHI TIẾT COMMENT ---
  commentsData: Record<string, Comment[]>;

  // --- QUẢN LÝ MODAL ---
  activeProductId: string | null;
  isModalOpen: boolean;
  activeCommentId: string | null;

  // --- QUẢN LÝ QUYỀN HẠN (NEW) ---
  // Lưu dưới dạng: { [communityId]: "owner" | "admin" | "mod" | "member" }
  communityRoles: Record<string, string>;

  // --- ACTIONS ---
  setProducts: (products: Product[]) => void;
  setInitialData: (data: {
    likesCount: Record<string, number>;
    commentsCount: Record<string, number>;
    likedIds: string[];
  }) => void;
  
  // Action cập nhật Role cho từng cộng đồng
  setCommunityRole: (communityId: string, role: string) => void;

  toggleLike: (productId: string) => void;
  openDetail: (productId: string, commentId?: string) => void;
  closeDetail: () => void;
  setProductComments: (productId: string, comments: Comment[]) => void;
  addOptimisticComment: (productId: string, comment: Comment) => void;
  removeComment: (productId: string, commentId: string) => void;
}

export const useProductStore = create<ProductState>()(
  immer((set) => ({
    // --- KHỞI TẠO GIÁ TRỊ ---
    products: [],
    likedIds: [],
    likesCount: {},
    commentsCount: {},
    commentsData: {},
    activeProductId: null,
    isModalOpen: false,
    activeCommentId: null,
    communityRoles: {}, // Khởi tạo rỗng

    // --- ACTIONS IMPLEMENTATION ---
    setProducts: (products) =>
      set((state) => {
        state.products = products;
      }),

    // Đồng bộ Role từ Server/Hook vào Store
    setCommunityRole: (communityId, role) =>
      set((state) => {
        if (!communityId) return;
        state.communityRoles[communityId] = role;
      }),

    setInitialData: (data) =>
      set((state) => {
        state.likedIds = Array.from(new Set([...state.likedIds, ...data.likedIds]));
        state.likesCount = { ...state.likesCount, ...data.likesCount };
        state.commentsCount = { ...state.commentsCount, ...data.commentsCount };
      }),

    toggleLike: (productId) =>
      set((state) => {
        const index = state.likedIds.indexOf(productId);
        const currentLikes = state.likesCount[productId] || 0;
        if (index !== -1) {
          state.likedIds.splice(index, 1);
          state.likesCount[productId] = Math.max(0, currentLikes - 1);
        } else {
          state.likedIds.push(productId);
          state.likesCount[productId] = currentLikes + 1;
        }
      }),

    openDetail: (productId, commentId) =>
      set((state) => {
        state.activeProductId = productId;
        state.isModalOpen = true;
        state.activeCommentId = commentId ?? null;
      }),

    closeDetail: () =>
      set((state) => {
        state.activeProductId = null;
        state.isModalOpen = false;
        state.activeCommentId = null;
      }),

    setProductComments: (productId, comments) =>
      set((state) => {
        state.commentsData[productId] = comments;
        state.commentsCount[productId] = comments.length;
      }),

    addOptimisticComment: (productId, comment) =>
      set((state) => {
        if (!state.commentsData[productId]) state.commentsData[productId] = [];
        state.commentsData[productId].unshift(comment);
        state.commentsCount[productId] = (state.commentsCount[productId] || 0) + 1;
      }),

    removeComment: (productId, commentId) =>
      set((state) => {
        if (state.commentsData[productId]) {
          state.commentsData[productId] = state.commentsData[productId].filter(
            (c) => c.id !== commentId
          );
          state.commentsCount[productId] = Math.max(0, (state.commentsCount[productId] || 1) - 1);
        }
      }),
  }))
);