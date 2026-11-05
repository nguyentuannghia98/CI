import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewState {
  viewMode: 'grid' | 'list';
  biggerGrid: boolean; // Dành cho các màn hình cần grid lớn hơn
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleViewMode: () => void;
  setBiggerGrid: (bigger: boolean) => void;
}

export const useViewStore = create<ViewState>()(
  // Persist giúp lưu lựa chọn của người dùng vào LocalStorage
  // Tắt trang đi bật lại vẫn giữ nguyên kiểu Grid/List đã chọn
  persist(
    (set) => ({
      viewMode: 'grid',
      biggerGrid: false,
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () => set((state) => ({ 
        viewMode: state.viewMode === 'grid' ? 'list' : 'grid' 
      })),
      setBiggerGrid: (bigger) => set({ biggerGrid: bigger }),
    }),
    { name: 'view-storage' }
  )
);