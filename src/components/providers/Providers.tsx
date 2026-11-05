// src/components/Providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 1. Web không bị đóng băng nhờ tự động load lại khi user quay lại tab
        refetchOnWindowFocus: true, 
        
        // 2. Tránh việc gọi API quá dồn dập làm chậm máy
        staleTime: 1000 * 60 * 5, // Dữ liệu được coi là "mới" trong 5 phút
        
        // 3. Tự động thử lại nếu request lỗi (do mạng chập chờn hoặc session đang refresh)
        retry: 1,
        
        // 4. Không xóa dữ liệu trong cache khi component bị unmount
        gcTime: 1000 * 60 * 60 * 24, // Giữ 24 giờ
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}