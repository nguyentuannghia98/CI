'use client'

import { useEffect, useState } from 'react'
import { Menu as HeadlessMenu } from '@headlessui/react'
import { ChevronDown, Loader2, User as UserIcon, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useTheme } from "next-themes"

// Thay thế import LoginModal bằng Store
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore"
import UserAvatar from '@/components/UserAvatar/UserAvatar';

interface UserMenuProps {
  variant?: "mobile" | "desktop";
  onOpenMobilePanel?: () => void;
}

export default function UserMenu({ variant = "desktop", onOpenMobilePanel }: UserMenuProps) {
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<{ username: string; avatar_url?: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Lấy hàm mở modal từ store
  const { openLogin } = useAuthModalStore()

  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    let active = true

    const loadProfile = async (uid: string) => {
      const { data: profile } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', uid)
        .single()
      if (active && profile) {
        setUserData({
          username: profile.username || 'Người dùng',
          avatar_url: profile.avatar_url || undefined,
        })
      }
    }

    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      setUser(data.user)
      if (data.user) await loadProfile(data.user.id)
      setLoadingUser(false)
    }
    getUser()

    // Lắng nghe thay đổi đăng nhập/đăng xuất để header không bị "cũ"
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setUserData(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (!mounted || loadingUser) {
    return <div className="px-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  // Logic kiểm tra theme hiện tại
  const isDark = theme === "dark"

  // Giao diện Mobile
  if (variant === "mobile") {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={user ? onOpenMobilePanel : openLogin}
          aria-label={user ? "Tài khoản" : "Đăng nhập"}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-current active:scale-95 transition-all"
        >
          {user ? (
            <UserAvatar avatarUrl={userData?.avatar_url} size="md" />
          ) : (
            <UserIcon size={20} className="text-inherit" />
          )}
        </button>
      </div>
    )
  }

  // Chưa đăng nhập (Desktop)
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        {/* ĐÃ ĐẢO: Đang tối (isDark) thì hiện Mặt trời để bấm bật sáng */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          className="p-2 rounded-lg hover:bg-current/5 transition-colors text-main"
        >
          {isDark ? <Sun size={18} className="text-orange-400" /> : <Moon size={18} className="text-blue-400" />}
        </button>
        <button
          onClick={openLogin}
          className="px-4 py-2 rounded-md text-sm font-normal text-inherit hover:bg-current/5 transition cursor-pointer whitespace-nowrap"
        >
          Đăng nhập
        </button>
      </div>
    )
  }

  // Đã đăng nhập (Desktop)
  return (
    <div className="flex items-center">
      <HeadlessMenu as="div" className="relative inline-block text-left">
        <HeadlessMenu.Button
          aria-label="Mở menu tài khoản"
          className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer group hover:bg-current/5 transition-colors text-main"
        >
          <UserAvatar avatarUrl={userData?.avatar_url} size="md" />
          <span className="font-normal text-sm hidden lg:block">
            {userData?.username}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </HeadlessMenu.Button>

        <HeadlessMenu.Items 
          className="absolute right-0 mt-2 w-52 origin-top-right border border-holder rounded-xl shadow-2xl z-50 overflow-hidden focus:outline-none py-1.5 bg-card backdrop-blur-3xl"
        >
          <div className="px-4 py-2 border-b border-holder mb-1 lg:hidden">
             <p className="text-[10px] text-holder font-normal uppercase tracking-widest">Tài khoản</p>
             <p className="text-sm font-bold text-main truncate">{userData?.username}</p>
          </div>

          <HeadlessMenu.Item>
            {({ active }) => (
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className={`flex w-full px-4 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'bg-main/5 text-accent' : 'text-main'
                }`}
              >
                Trang cá nhân
              </button>
            )}
          </HeadlessMenu.Item>

          {/* MỤC ĐỔI GIAO DIỆN (TÍCH HỢP) */}
          <HeadlessMenu.Item>
            {({ active }) => (
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'bg-main/5 text-accent' : 'text-main'
                }`}
              >
                {/* ĐÃ ĐẢO: Đang tối (isDark) thì hiện chữ "Chế độ Sáng" + icon Mặt trời */}
                <span>{isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span>
                {isDark ? (
                  <Sun size={16} className="text-orange-400" />
                ) : (
                  <Moon size={16} className="text-blue-400" />
                )}
              </button>
            )}
          </HeadlessMenu.Item>

          <div className="my-1 border-t border-holder" />

          <HeadlessMenu.Item>
            {({ active }) => (
              <button
                onClick={async () => {
                  if (user) {
                    await supabase.from('users').update({ is_online: false }).eq('id', user.id);
                  }
                  await supabase.auth.signOut()
                  setUser(null)
                  setUserData(null)
                  router.push('/')
                  router.refresh()
                }}
                className={`flex w-full px-4 py-2.5 text-left text-sm font-bold transition-colors cursor-pointer ${
                  active ? 'bg-red-500/10 text-red-500' : 'text-red-500'
                }`}
              >
                Đăng xuất
              </button>
            )}
          </HeadlessMenu.Item>
        </HeadlessMenu.Items>
      </HeadlessMenu>
    </div>
  )
}