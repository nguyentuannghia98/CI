"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Star, Shield, Info, Package, Sparkles } from "lucide-react"; 
import { useProfileData } from "./hooks/useProfileData";
import { useChat } from "@/components/MiniChat/ChatContext";
import ProfileHeader from "@/components/profile/components/ProfileHeader";
import ProfileBanner from "@/components/profile/components/ProfileBanner";
import ProfileAvatar from "@/components/profileavatar/ProfileAvatar";
import ProfileForm from "@/components/profile/components/ProfileForm";
import UserRating from "@/components/userratings/UserRating";
import ReportUserModal from "@/components/profile/components/ReportUserModal";
import ProductsList from "@/components/ProductsList/ProductsList";
import { useQueryClient } from "@tanstack/react-query";
import { useProductStore } from "@/lib/Zustard/store/useProductStore";

export default function ProfileView({ profileId }: { profileId: string }) {
  const { openChat } = useChat();
  const queryClient = useQueryClient();
  const setStoreProducts = useProductStore((state) => state.setProducts);

  const {
    user,
    ratingStats, 
    loading,
    isOwnProfile,
    isFollowing,
    formData,
    setFormData,
    updateAvatar,
    saveProfile,
    userProducts,
    deleteUserProduct,
  } = useProfileData(profileId);

  const [isEditing, setIsEditing] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // ✅ ĐỒNG BỘ DATA VỚI ROOT MODAL: 
  useEffect(() => {
    if (userProducts && userProducts.length > 0) {
      setStoreProducts(userProducts);
    }
  }, [userProducts, setStoreProducts]);

  const styleSurface = { backgroundColor: 'rgb(var(--bg-surface))', color: 'rgb(var(--text-main))' };
  const styleCard = { backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' };
  const textMuted = { color: 'rgb(var(--text-muted))' };

  if (loading && !user) {
    return (
      <div className="flex h-[70vh] items-center justify-center" style={styleSurface}>
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl border border-white/10 bg-[rgb(var(--bg-card))]/50 backdrop-blur-md shadow-2xl">
          <div className="relative w-12 h-12">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p style={textMuted} className="font-bold uppercase text-xs tracking-widest text-orange-400 animate-pulse">
            Đang khởi tạo hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="py-24 text-center px-4" style={styleSurface}>
        <div className="max-w-md mx-auto p-10 rounded-3xl border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-card))] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl font-bold">
            ?
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
            Không tìm thấy người dùng
          </h2>
          <p style={textMuted} className="text-sm">
            Tài khoản này có thể đã bị xóa hoặc đường dẫn hồ sơ không chính xác.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full min-h-screen px-4 md:px-6 pt-2 pb-16 transition-colors duration-300 font-sans" style={styleSurface}>
      <h1 className="sr-only">{user?.full_name || user?.username || "Hồ sơ thành viên"}</h1>
      
      {/* Banner Section */}
      <div className="relative pt-4"> 
        <div className="h-48 sm:h-56 md:h-72 w-full overflow-hidden rounded-[2.5rem] relative border shadow-2xl" style={styleCard}>
          <ProfileBanner
            userId={user!.id}
            bannerUrl={user!.banner_url || ""}
            title={user!.username || "Thành viên"}
            isOwner={isOwnProfile}
            uploading={false}
          />
        </div>

        {/* Avatar & Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between px-6 md:px-10 -mt-20 md:-mt-24 relative z-20 gap-4">
          <div className="shrink-0 relative inline-block drop-shadow-2xl">
            <ProfileAvatar
              avatarUrl={user!.avatar_url || ""}
              username={user!.username || "User"}
              onUploaded={updateAvatar}
              isOwner={isOwnProfile}
              userIdFromProfile={user!.id}
            />
          </div>

          <div className="pb-0 md:pb-2 flex-1 min-w-0 w-full">
            <ProfileHeader
              followingId={user!.id} 
              isEditing={isEditing}
              isOwnProfile={isOwnProfile}
              onEdit={() => setIsEditing(true)}
              onSave={async () => {
                const result = await saveProfile();
                if (!result.error) setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
              isFollowing={isFollowing}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["profile", profileId] })}
              onMessage={() => !isOwnProfile && openChat(user!.id)}
              onReport={() => setOpenReport(true)}
              displayName={user!.full_name || user!.username || "Thành viên"}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="mt-8 mb-12">
        <div 
          className="p-6 sm:p-10 rounded-[2.5rem] border shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500" 
          style={{
            backgroundColor: 'rgba(var(--bg-card), 0.85)',
            borderColor: 'rgba(var(--border-main), 0.3)'
          }}
        >
          
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[rgba(var(--border-main),0.2)]">
                <User className="text-orange-400" size={20} />
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-orange-400">
                  Thông tin cá nhân
                </h2>
              </div>
              <ProfileForm
                isEditing={isEditing && isOwnProfile}
                user={user!}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          )}

          {activeTab === "rating" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[rgba(var(--border-main),0.2)]">
                <Star className="text-amber-400 fill-amber-400" size={20} />
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-amber-500">
                  Uy tín cộng đồng
                </h2>
              </div>
              <UserRating 
                reviewedUserId={user!.id} 
                data={ratingStats} 
              />
            </div>
          )}

          {(activeTab === "policy" || activeTab === "about") && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[rgba(var(--border-main),0.2)]">
                {activeTab === "policy" ? <Shield className="text-orange-400" size={20} /> : <Info className="text-orange-400" size={20} />}
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-orange-400">
                  {activeTab === "policy" ? "Chính sách bán hàng" : "Về chúng tôi"}
                </h2>
              </div>
              <div style={{ color: 'rgb(var(--text-main))' }}>
                {isEditing && isOwnProfile ? (
                  <textarea
                    value={activeTab === "policy" ? formData.selling_policy : formData.bio}
                    onChange={(e) => setFormData({ ...formData, [activeTab === "policy" ? 'selling_policy' : 'bio']: e.target.value })}
                    className="w-full min-h-[200px] p-6 rounded-3xl outline-none text-sm border font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all leading-relaxed"
                    style={{ backgroundColor: 'rgb(var(--bg-surface))', borderColor: 'rgba(var(--border-main), 0.3)' }}
                    placeholder="Nhập nội dung chia sẻ..."
                  />
                ) : (
                  <div className="p-6 rounded-3xl border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-surface))]/60">
                    <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base opacity-90 font-normal">
                      {activeTab === "policy" ? (user!.selling_policy || "Chưa có chính sách.") : (user!.bio || "Chưa có giới thiệu.")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <main className="w-full">
        <div className="flex items-center justify-between mb-8 px-2 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
                Danh mục sản phẩm
              </h2>
            </div>
          </div>
          
          <span className="px-4 py-1.5 rounded-full text-xs font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-sm">
            {userProducts?.length || 0} SẢN PHẨM
          </span>
        </div>
        
        <ProductsList 
          products={userProducts} 
          isLoading={loading} 
          onDelete={deleteUserProduct} 
          showFilter={userProducts.length > 0} 
        />
      </main>

      {/* Modals */}
      {openReport && <ReportUserModal reportedUser={user!} onClose={() => setOpenReport(false)} />}
      
    </div>
  );
}
