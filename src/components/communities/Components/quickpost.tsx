"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, X, ImagePlus, PlusCircle, Tag as TagIcon, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reserveProductIdAction, finalizeProductAction } from "@/app/actions/ComunnitiesActions/post";

interface QuickPostProps {
  communityId: string;
  userId: string;
  onPostCreated?: () => void;
}

interface CommunityTag {
  id: string;
  name: string;
}

export default function QuickPostModal({ communityId, userId, onPostCreated }: QuickPostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<CommunityTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  
  const supabase = createClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = async () => {
    setIsOpen(true);
    setIsReserving(true);
    try {
      const id = await reserveProductIdAction(communityId);
      setProductId(id);
    } catch (err) {
      console.error("Lỗi lấy ID nháp:", err);
    } finally {
      setIsReserving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        const { data, error } = await supabase
          .from("community_tags")
          .select("id, name")
          .eq("community_id", communityId);
        if (!error && data) setAvailableTags(data);
      };
      fetchTags();
    }
  }, [isOpen, communityId, supabase]);

  const { mutate: handleFinalize, isPending } = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Vui lòng nhập tên sản phẩm");
      if (!productId) throw new Error("Lỗi hệ thống: Không tìm thấy ID sản phẩm");
      
      // ĐÃ ĐỒNG BỘ: Truyền đúng 1 object duy nhất
      return await finalizeProductAction({
        productId,
        title: title.trim(),
        description: description.trim(),
        tagId: selectedTagId,
        communityId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-products", communityId] });
      if (onPostCreated) onPostCreated();
      resetForm();
    },
    onError: (error: Error) => alert("🚨 Lỗi: " + error.message)
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImages([]);
    setSelectedTagId(null);
    setProductId(null);
    setIsOpen(false);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !productId) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canPost = title.trim() && !isPending && !isUploading && productId && !isReserving;

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl font-normal text-sm border transition-all active:scale-95 shadow-sm cursor-pointer"
        style={{ backgroundColor: 'rgb(var(--bg-card))', color: 'rgb(var(--text-main))', borderColor: 'rgba(var(--border-main), 0.5)' }}
      >
        <PlusCircle size={18} />
        <span>Đăng bài</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer" onClick={resetForm} />

          <div className="relative w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border"
               style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}>
            
            {isReserving && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                <p className="mt-2 text-sm text-muted-foreground">Đang khởi tạo bài đăng...</p>
              </div>
            )}

            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
              <h3 className="text-xl font-normal" style={{ color: 'rgb(var(--text-main))' }}>Tạo bài đăng mới</h3>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <div className="flex gap-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white font-normal"
                     style={{ backgroundColor: 'rgb(var(--text-muted))' }}>
                  {userId.substring(0, 1).toUpperCase()}
                </div>
                
                <div className="flex-1 space-y-4">
                  <input
                    type="text"
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tên sản phẩm..."
                    className="w-full border-none focus:ring-0 font-normal text-xl p-0 bg-transparent outline-none"
                    style={{ color: 'rgb(var(--text-main))' }}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết..."
                    className="w-full min-h-[100px] border-none focus:ring-0 resize-none text-base py-2 bg-transparent outline-none"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  />

                  {availableTags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-normal uppercase tracking-wider text-muted-foreground">
                        <TagIcon size={12} />
                        <span>Chọn Tag</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs transition-all border cursor-pointer ${
                              selectedTagId === tag.id ? "bg-orange-400 text-white border-orange-400" : "hover:border-orange-400/50 text-muted-foreground"
                            }`}
                          >
                            {selectedTagId === tag.id && <Check size={12} className="inline mr-1" />}
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(images.length > 0 || isUploading) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {images.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border">
                          {/* Ảnh xem trước là blob:/data URL nên không tối ưu được qua next/image */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {isUploading && (
                        <div className="w-20 h-20 rounded-xl flex items-center justify-center border border-dashed animate-pulse bg-black/5">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 flex items-center justify-between border-t bg-black/5">
              <button
                type="button"
                disabled={isUploading || images.length >= 5 || !productId}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:bg-black/5 disabled:opacity-50 cursor-pointer"
              >
                <ImagePlus size={18} />
                <span>Thêm ảnh</span>
              </button>
              <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} accept="image/*" />

              <button
                type="button"
                onClick={() => handleFinalize()}
                disabled={!canPost}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-2xl font-normal text-sm transition-all shadow-lg cursor-pointer ${
                  canPost ? "bg-orange-400 text-white hover:bg-orange-500" : "bg-gray-400/20 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Đăng bài</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}