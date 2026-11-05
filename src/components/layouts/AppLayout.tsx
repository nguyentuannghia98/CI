"use client";

import React, { useState, createContext, useContext, useMemo, useEffect } from "react";
import SidebarLeft from "@/components/sidebarleft/components/SidebarLeft";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import LiveFeedback from "./LiveFeedback";
import { createClient } from "@/lib/supabase/client"; 
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser"; 

interface GridContextType {
  biggerGrid: boolean;
  toggleGrid: () => void;
}
const GridContext = createContext<GridContextType>({
  biggerGrid: false,
  toggleGrid: () => {},
});
export const useGridContext = () => useContext(GridContext);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [biggerGrid, setBiggerGrid] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const supabase = createClient();
  const currentUserId = useCurrentUser(); 

  const SIDEBAR_LEFT_WIDTH = 250;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Logic Online/Offline
  useEffect(() => {
    if (!currentUserId) return;

    const updateOnlineStatus = async (status: boolean) => {
      await supabase
        .from('users')
        .update(
          status
            ? { is_online: true, last_seen: new Date().toISOString() }
            : { is_online: false }
        )
        .eq('id', currentUserId);
    };

    const channel = supabase.channel('online-status', {
      config: {
        presence: { key: currentUserId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        updateOnlineStatus(Boolean(state[currentUserId]));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const heartbeat = setInterval(() => {
      updateOnlineStatus(true);
    }, 20000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(heartbeat);
      channel.unsubscribe();
      updateOnlineStatus(false);
    };
  }, [currentUserId, supabase]);

  const contextValue = useMemo(() => ({ 
    biggerGrid, 
    toggleGrid: () => setBiggerGrid((prev) => !prev)
  }), [biggerGrid]);

  if (!mounted) return null;

  return (
    <GridContext.Provider value={contextValue}>
      {/* class theme-bg sẽ giúp đổi màu khi bấm nút Dark Mode */}
      <div className="theme-bg min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300">
        <HeaderBar
          biggerGrid={biggerGrid}
          toggleGrid={contextValue.toggleGrid}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="w-full flex flex-1 relative">
          <aside 
            className="hidden md:block fixed left-0 top-0 h-screen border-r theme-bg" 
            style={{ width: SIDEBAR_LEFT_WIDTH, zIndex: 40 }}
          >
            <SidebarLeft />
          </aside>
          
          <div className="flex-1 w-full md:pl-[250px] flex flex-col theme-bg"> 
            <div className="md:hidden w-full border-b theme-bg">
               <SidebarLeft /> 
            </div>

            {/* Main content mở rộng toàn bộ chiều rộng bên phải (đã loại bỏ hoàn toàn sidebar phải trống) */}
            <div className="w-full flex-1 flex flex-col theme-bg">
              <main className="w-full flex-1 min-w-0 bg-transparent"> 
                {children}
              </main>
            </div>
          </div>
        </div>

        {/* LiveFeedback là component fixed góc dưới phải */}
        <LiveFeedback />
      </div>
    </GridContext.Provider>
  );
}
