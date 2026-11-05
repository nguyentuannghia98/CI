"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, X, ImagePlus, Tag as TagIcon, Users, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProductAction } from "@/app/actions/menupost";
import Portal from "@/components/Portal/Portal";
import Image from "next/image";

export interface QuickPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPostCreated?: () => void;
}

interface PostCommunity {
  id: string;
  title: string;
  avatar_url: string | null;
}

interface PostTag {
  id: string;
  name: string;
}

export default function QuickPostModal({ 
  isOpen, 
  onClose, 
  userId, 
  onPostCreated 
}: QuickPostModalProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // --- States ---
  const [communities, setCommunities] = useState<PostCommunity[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<PostCommunity | null>(null);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<PostTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Communities ---
  useEffect(() => {
    if (isOpen && userId) {
      const fetchUserCommunities = async () => {
        setIsLoadingCommunities(true);
        const { data, error } = await supabase
          .from("community_members")
          .select(`
            community_id,
            communities (
              id,
              title,
              avatar_url
            )
          `)
          .eq("user_id", userId);

        if (!error && data) {
          const list = (data as { communities: PostCommunity | null }[])
            .map((item) => item.communities)
            .filter((c): c is PostCommunity => c !== null);
            
          setCommunities(list);
          if (list.length > 0 && !selectedCommunity) {
            setSelectedCommunity(list[0]);
          }
        }
        setIsLoadingCommunities(false);
      };
      fetchUserCommunities();
    }
    // Chỉ fetch khi mở modal / đổi user; selectedCommunity chỉ dùng làm giá trị khởi tạo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, supabase]);

  // --- Fetch Tags ---
  useEffect(() => {
    if (selectedCommunity?.id) {
      const fetchTags = async () => {
        const { data, error } = await supabase
          .from("community_tags")
          .select("id, name")
          .eq("community_id", selectedCommunity.id);

        if (!error && data) {
          setAvailableTags(data ?? []);
          setSelectedTagId(null);
        }
      };
      fetchTags();
    }
  }, [selectedCommunity, supabase]);

  // --- Handlers ---
  const handleClose = () => {
    setTitle("");
    setDescription("");
    setImages([]);
    setSelectedTagId(null);
    onClose();
  };

  const { mutate: handleCreateProduct, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedCommunity) throw new Error("Vui lòng chọn một cộng đồng");
      if (!title.trim()) throw new Error("Vui lòng nhập tiêu đề");
      
      return await createProductAction({
        title: title.trim(),
        description: description.trim(),
        images,
        communityId: selectedCommunity.id,
        tagId: selectedTagId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-products"] });
      if (onPostCreated) onPostCreated();
      handleClose();
    },
    onError: (error: Error) => alert("Lỗi: " + error.message)
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
        setImages(prev => [...prev, publicUrl]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canPost = title.trim() && selectedCommunity && !isPending && !isUploading;

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-8 pointer-events-auto transition-all duration-300">
        <div className="fixed inset-0 -z-10 cursor-default" onClick={handleClose} />

        <div 
          className="relative w-full max-w-xl rounded-[32px] shadow-2xl overflow-visible animate-in fade-in zoom-in slide-in-from-top-4 duration-300 h-fit mt-10 mb-20 border"
          style={{ 
            backgroundColor: 'rgb(var(--bg-card))', 
            borderColor: 'rgba(var(--border-main), 0.3)' 
          }}
        >
          
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}
          >
            <div className="flex flex-col">
              <h3 className="text-xl font-normal" style={{ color: 'rgb(var(--text-main))' }}>Tạo bài đăng</h3>
              <p className="text-xs font-normal" style={{ color: 'rgb(var(--text-muted))' }}>Chia sẻ nội dung vào cộng đồng của bạn</p>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar overflow-x-visible">
            <div className="space-y-6">
              
              {/* Dropdown cộng đồng */}
              <div className="relative">
                <label 
                  className="text-xs font-normal uppercase tracking-widest mb-2 block"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  Đăng vào cộng đồng
                </label>
                <button 
                  onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                  disabled={isLoadingCommunities}
                  className="w-full flex items-center justify-between p-3 rounded-2xl transition-all disabled:opacity-50 border cursor-pointer disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'rgba(var(--border-main), 0.05)',
                    borderColor: 'rgba(var(--border-main), 0.1)' 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                      {selectedCommunity?.avatar_url ? (
                        <Image src={selectedCommunity.avatar_url} alt="avatar" fill sizes="32px" className="object-cover" />
                      ) : <Users size={18} />}
                    </div>
                    <span className="font-normal truncate" style={{ color: 'rgb(var(--text-main))' }}>
                      {isLoadingCommunities ? "Đang tải..." : (selectedCommunity?.title || "Chọn cộng đồng...")}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isCommunityOpen ? 'rotate-180' : ''}`} style={{ color: 'rgb(var(--text-muted))' }} />
                </button>

                {isCommunityOpen && (
                  <div 
                    className="absolute top-full left-0 w-full mt-2 rounded-2xl shadow-2xl z-[110] max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 border"
                    style={{ 
                      backgroundColor: 'rgb(var(--bg-card))',
                      borderColor: 'rgba(var(--border-main), 0.3)'
                    }}
                  >
                    {communities.length > 0 ? (
                      communities.map((com) => (
                        <div 
                          key={com.id}
                          onClick={() => {
                            setSelectedCommunity(com);
                            setIsCommunityOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                            selectedCommunity?.id === com.id ? "bg-orange-500/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }}>
                             {com.avatar_url ? (
                               <Image src={com.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                             ) : <Users size={14} className="m-auto mt-2" style={{ color: 'rgb(var(--text-muted))' }} />}
                          </div>
                          <span className="text-sm font-normal truncate" style={{ color: 'rgb(var(--text-main))' }}>{com.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Bạn chưa tham gia cộng đồng nào</div>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Content */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề bài viết..."
                  className="w-full border-none focus:ring-0 font-normal text-2xl p-0 outline-none bg-transparent"
                  style={{ color: 'rgb(var(--text-main))' }}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bạn đang nghĩ gì?"
                  className="w-full min-h-[120px] border-none focus:ring-0 resize-none text-lg py-2 outline-none bg-transparent font-normal"
                  style={{ color: 'rgba(var(--text-main), 0.8)' }}
                />
              </div>

              {/* Tags Selection */}
              {availableTags.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-normal uppercase tracking-widest" style={{ color: 'rgb(var(--text-muted))' }}>
                    <TagIcon size={12} />
                    <span>Thẻ bài viết</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                        className={`px-4 py-2 rounded-full text-xs font-normal transition-all border cursor-pointer ${
                          selectedTagId === tag.id
                            ? "bg-orange-500 border-orange-500 text-white shadow-md"
                            : "bg-transparent hover:border-orange-500 hover:text-orange-500"
                        }`}
                        style={{ 
                          borderColor: selectedTagId === tag.id ? 'transparent' : 'rgba(var(--border-main), 0.3)',
                          color: selectedTagId === tag.id ? '#fff' : 'rgb(var(--text-main))'
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Images */}
              {(images.length > 0 || isUploading) && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
                      {/* Ảnh xem trước là blob:/data URL nên không tối ưu được qua next/image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {isUploading && (
                    <div 
                      className="aspect-square rounded-2xl flex items-center justify-center border-2 border-dashed"
                      style={{ 
                        backgroundColor: 'rgba(var(--border-main), 0.05)',
                        borderColor: 'rgba(var(--border-main), 0.2)'
                      }}
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div 
            className="p-6 flex items-center justify-between border-t"
            style={{ 
              backgroundColor: 'rgba(var(--border-main), 0.03)',
              borderColor: 'rgba(var(--border-main), 0.1)' 
            }}
          >
            <button
              type="button"
              disabled={isUploading || images.length >= 5}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-normal text-sm border disabled:opacity-50 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))',
                borderColor: 'rgba(var(--border-main), 0.3)',
                color: 'rgb(var(--text-main))'
              }}
            >
              <ImagePlus size={20} className="text-orange-500" />
              <span>Ảnh</span>
            </button>
            <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} accept="image/*" />

            <button
              type="button"
              onClick={() => handleCreateProduct()}
              disabled={!canPost}
              className={`flex items-center gap-3 px-10 py-3 rounded-2xl font-normal text-sm transition-all shadow-xl ${
                canPost 
                  ? "bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600 active:scale-95 cursor-pointer" 
                  : "bg-gray-400 text-white opacity-50 cursor-not-allowed"
              }`}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>ĐĂNG BÀI</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}