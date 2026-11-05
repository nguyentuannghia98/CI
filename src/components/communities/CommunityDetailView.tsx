"use client";

import React from "react";
import { useCommunityData } from "./hooks/useCommunityData";
import CommunityHeader from "./Components/CommunityHeader";
import EmptyState from "./Components/EmptyState";
import JoinLeaveButton from "./Components/JoinLeaveButtons";
import LoadingState from "./Components/LoadingState";
import CreateTagButton from "./Components/CreateTagButton";
import QuickPost from "./Components/quickpost"; 
import ProductsList from "@/components/ProductsList/ProductsList";
import ModModeToggle from "./Components/ModModeToggle"; 
import { useCommunityStore } from "@/lib/Zustard/CommunityStore/CommunityStore";
import type { Database } from "@/types/supabase";
import type { Product } from "@/components/UniversalCard/types/type";
import { Newspaper, Sparkles } from "lucide-react";

export default function CommunityDetailView({
  communityId,
  initialCommunity,
  initialProducts,
}: {
  communityId: string;
  initialCommunity: Database["public"]["Tables"]["communities"]["Row"];
  initialProducts: Product[];
}) {
  const {
    community,
    products,
    reports,
    loading,
    refreshData,
    user: currentUser,
  } = useCommunityData(communityId, initialCommunity, initialProducts);

  const { isMod, userRole } = useCommunityStore();

  if (loading && !community) return <LoadingState />;
  if (!community) return <EmptyState />;

  return (
    <div className="w-full min-h-screen transition-colors duration-300 font-sans pb-16" style={{ backgroundColor: 'rgb(var(--bg-surface))' }}>
      
      {/* Header & Thanh công cụ cộng đồng */}
      <div 
        className="border-b shadow-sm relative z-20 backdrop-blur-xl" 
        style={{ 
          backgroundColor: 'rgba(var(--bg-card), 0.95)', 
          borderColor: 'rgba(var(--border-main), 0.3)' 
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2">
          <CommunityHeader 
            community={community} 
            role={userRole} 
          />

          {/* Action Toolbar */}
          <div className="flex flex-wrap justify-between items-center py-4 gap-4 border-t border-[rgba(var(--border-main),0.15)] mt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <JoinLeaveButton communityId={communityId} />
              
              {currentUser && (
                <QuickPost
                  communityId={communityId}
                  userId={currentUser.id}
                  onPostCreated={refreshData} 
                />
              )}
            </div>
            
            {/* Vùng chỉ dành cho Mod */}
            {isMod && (
              <div className="flex items-center gap-3 flex-wrap">
                <CreateTagButton communityId={communityId} />
                <ModModeToggle reports={reports} onRefresh={refreshData} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách bài viết & sản phẩm */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full">
          <div className="flex items-center justify-between px-2 mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm">
                <Newspaper size={22} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
                Bản tin cộng đồng
              </h2>
            </div>

            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-sm">
              {products.length} bài viết
            </span>
          </div>

          <ProductsList 
            products={products}
            isLoading={false}
            showFilter={products.length > 0}
            currentRole={userRole} 
            isCommunity={true}
          />
        </div>
      </div>
    </div>
  );
}
