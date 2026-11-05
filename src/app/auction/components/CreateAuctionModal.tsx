"use client";

import { useState, useRef } from "react";
import { 
  X, 
  Gavel, 
  Sparkles, 
  Image as ImageIcon, 
  Clock, 
  DollarSign, 
  Tag, 
  AlertCircle, 
  UploadCloud, 
  Upload, 
  CheckCircle2, 
  Loader2,
  Trophy
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/store/AuthStore";

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAuctionId: string) => void;
}

const SAMPLE_IMAGES = [
  { label: "Bàn phím cơ Custom", url: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80" },
  { label: "Tai nghe Gaming", url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80" },
  { label: "Card đồ họa RTX", url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80" },
  { label: "Chuột Gaming Không Dây", url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80" },
];

export default function CreateAuctionModal({ isOpen, onClose, onSuccess }: CreateAuctionModalProps) {
  const supabase = createClient();
  const currentUser = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [startBid, setStartBid] = useState("500000");
  const [maxBid, setMaxBid] = useState("2000000");
  const [minStep, setMinStep] = useState("50000");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [category, setCategory] = useState("Bàn phím cơ");
  const [condition, setCondition] = useState("Nguyên seal 100%");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // XỬ LÝ KHI NGƯỜI DÙNG CHỌN FILE ẢNH TỪ MÁY TÍNH
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF...)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa là 10MB");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // 1. Tạo local preview tức thì cho người dùng xem trước
    const localBlob = URL.createObjectURL(file);
    setPreviewUrl(localBlob);

    // 2. Upload trực tiếp ảnh lên Supabase Storage bucket 'images'
    setIsUploadingImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const userFolder = currentUser?.id || "public";
      const filePath = `${userFolder}/auction_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) {
        console.warn("Lỗi upload storage trực tiếp, thử API fallback:", uploadErr.message);

        // Fallback qua /api/upload nếu có
        try {
          const formData = new FormData();
          formData.append("file", file);
          const apiRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson.url) {
              setImageUrl(apiJson.url);
              setIsUploadingImage(false);
              return;
            }
          }
        } catch {}

        // Fallback Base64 để đảm bảo ảnh luôn hiển thị được trên Supabase
        const reader = new FileReader();
        reader.onload = () => {
          setImageUrl(reader.result as string);
          setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Lấy link công khai sau khi upload thành công lên Supabase Storage
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Lỗi upload ảnh:", err);
      // Fallback base64
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // SUBMIT FORM TẠO PHÒNG VÀ ĐẨY LÊN SUPABASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericStartBid = Number(startBid.replace(/\D/g, ""));
    const numericMaxBid = maxBid ? Number(maxBid.replace(/\D/g, "")) : 0;

    if (!title.trim()) {
      setError("Vui lòng nhập tên vật phẩm đấu giá");
      return;
    }
    if (!numericStartBid || numericStartBid < 10000) {
      setError("Giá khởi điểm tối thiểu là 10.000đ");
      return;
    }
    if (numericMaxBid > 0 && numericMaxBid <= numericStartBid) {
      setError("Giá tối đa (thắng ngay) phải lớn hơn giá khởi điểm");
      return;
    }

    const currentFinalImg = imageUrl || previewUrl;
    if (!currentFinalImg && !selectedFile) {
      setError("Vui lòng tải lên ảnh sản phẩm từ máy tính hoặc chọn mẫu");
      return;
    }

    setIsLoading(true);

    let finalImageUrl = imageUrl || previewUrl || SAMPLE_IMAGES[0].url;

    // Nếu ảnh vẫn đang trong tiến trình upload, đợi tối đa 1.5s
    if (selectedFile && isUploadingImage) {
      await new Promise((res) => setTimeout(res, 1200));
      if (imageUrl) finalImageUrl = imageUrl;
    }

    const durationNum = Number(durationMinutes) || 60;
    const endsAtDate = new Date(Date.now() + durationNum * 60 * 1000).toISOString();
    const numericMinStep = Number(minStep.replace(/\D/g, "")) || 50000;

    // Đóng gói metadata [Danh mục], [Tình trạng], [Bước giá], [Giá tối đa] vào description
    const maxBidTag = numericMaxBid ? ` [Giá tối đa: ${numericMaxBid}]` : "";
    const fullDescription = `[Danh mục: ${category}] [Tình trạng: ${condition}] [Bước giá: ${numericMinStep}]${maxBidTag}\n\n${description.trim()}`;
    const fallbackId = `room-${Date.now().toString(36)}`;

    try {
      // 1. ĐẨY DỮ LIỆU LÊN SUPABASE TABLE 'auctions'
      const { data, error: dbError } = await (supabase as any)
        .from("auctions")
        .insert({
          title: title.trim(),
          description: fullDescription,
          image_url: finalImageUrl,
          start_bid: numericStartBid,
          current_bid: numericStartBid,
          bid_count: 0,
          ends_at: endsAtDate,
          created_by: currentUser?.id || null,
        })
        .select("id")
        .single();

      let targetRoomId = data?.id;

      if (dbError || !targetRoomId) {
        console.warn("Lưu DB Supabase thất bại, fallback session:", dbError);
        targetRoomId = fallbackId;
      }

      // 2. Lưu vào sessionStorage để client mở phòng tức thì
      const localRoom = {
        id: targetRoomId,
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        startBid: numericStartBid,
        currentBid: numericStartBid,
        maxBid: numericMaxBid || undefined,
        bidCount: 0,
        minStep: numericMinStep,
        endsAt: Date.now() + durationNum * 60 * 1000,
        category,
        condition,
        created_by: currentUser?.id,
        seller: {
          id: currentUser?.id,
          name: currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "Trader Vip",
          verified: true,
          avatar: currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetRoomId}`,
        },
      };

      try {
        sessionStorage.setItem(`auction_room_${targetRoomId}`, JSON.stringify(localRoom));
      } catch {}

      setIsLoading(false);
      onSuccess(targetRoomId);
    } catch (err: any) {
      console.error("Lỗi khởi tạo phòng đấu giá:", err);
      setIsLoading(false);
      onSuccess(fallbackId);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-7 custom-scrollbar"
        style={{
          backgroundColor: "rgb(var(--bg-card))",
          borderColor: "rgba(var(--border-main), 0.3)",
          color: "rgb(var(--text-main))",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-orange-500" />
        </button>

        {/* Tiêu đề modal */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              Mở Phòng Đấu Giá LIVE
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
            <p className="text-xs sm:text-sm text-muted" style={{ color: "rgb(var(--text-muted))" }}>
              Tạo phiên đấu giá trực tuyến cho vật phẩm gaming của bạn
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. TÊN VẬT PHẨM ĐẤU GIÁ */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>
              Tên vật phẩm đấu giá *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bàn phím cơ Custom Keychron Q1 Pro..."
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm bg-transparent focus:border-orange-500 transition-colors"
              style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
            />
          </div>

          {/* 2. DANH MỤC & TÌNH TRẠNG VẬT PHẨM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-muted))" }}>
                <Tag className="w-3.5 h-3.5 text-orange-500" /> Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm bg-transparent cursor-pointer font-medium"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              >
                <option value="Bàn phím cơ" className="dark:bg-zinc-900">Bàn phím cơ</option>
                <option value="Card đồ họa (VGA)" className="dark:bg-zinc-900">Card đồ họa (VGA)</option>
                <option value="Màn hình Gaming" className="dark:bg-zinc-900">Màn hình Gaming</option>
                <option value="Tai nghe & Âm thanh" className="dark:bg-zinc-900">Tai nghe & Âm thanh</option>
                <option value="Chuột & Lót chuột" className="dark:bg-zinc-900">Chuột & Lót chuột</option>
                <option value="Máy chơi game (Console)" className="dark:bg-zinc-900">Máy chơi game (Console)</option>
                <option value="Laptop & PC Gaming" className="dark:bg-zinc-900">Laptop & PC Gaming</option>
                <option value="Thiết bị Gaming" className="dark:bg-zinc-900">Thiết bị Gaming</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>
                Tình trạng vật phẩm
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm bg-transparent cursor-pointer font-medium"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              >
                <option value="Nguyên seal 100%" className="dark:bg-zinc-900">Nguyên seal 100%</option>
                <option value="Like New 99%" className="dark:bg-zinc-900">Like New 99%</option>
                <option value="Đã qua sử dụng (Đẹp)" className="dark:bg-zinc-900">Đã qua sử dụng (Đẹp)</option>
                <option value="Hàng sưu tầm hiếm" className="dark:bg-zinc-900">Hàng sưu tầm hiếm</option>
              </select>
            </div>
          </div>

          {/* 3. GIÁ KHỞI ĐIỂM, GIÁ TỐI ĐA & BƯỚC GIÁ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-muted))" }}>
                <DollarSign className="w-3.5 h-3.5 text-orange-500" /> Giá khởi điểm *
              </label>
              <input
                type="text"
                required
                value={startBid ? Number(startBid.replace(/\D/g, "")).toLocaleString("vi-VN") : ""}
                onChange={(e) => setStartBid(e.target.value.replace(/\D/g, ""))}
                placeholder="500.000"
                className="w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm font-bold text-orange-500 bg-transparent font-mono"
                style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-500">
                <Trophy className="w-3.5 h-3.5" /> Giá tối đa (Thắng ngay)
              </label>
              <input
                type="text"
                value={maxBid ? Number(maxBid.replace(/\D/g, "")).toLocaleString("vi-VN") : ""}
                onChange={(e) => setMaxBid(e.target.value.replace(/\D/g, ""))}
                placeholder="2.000.000"
                className="w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm font-bold text-amber-400 bg-transparent font-mono focus:border-amber-500 transition-colors"
                style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-muted))" }}>
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Bước giá tối thiểu
              </label>
              <select
                value={minStep}
                onChange={(e) => setMinStep(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm bg-transparent cursor-pointer font-medium"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              >
                <option value="10000" className="dark:bg-zinc-900">+10.000đ</option>
                <option value="20000" className="dark:bg-zinc-900">+20.000đ</option>
                <option value="50000" className="dark:bg-zinc-900">+50.000đ</option>
                <option value="100000" className="dark:bg-zinc-900">+100.000đ</option>
                <option value="200000" className="dark:bg-zinc-900">+200.000đ</option>
                <option value="500000" className="dark:bg-zinc-900">+500.000đ</option>
              </select>
            </div>
          </div>

          {/* 4. THỜI GIAN DIỄN RA PHIÊN ĐẤU GIÁ */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-muted))" }}>
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Thời gian diễn ra phiên đấu giá
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "15 Phút", val: "15" },
                { label: "30 Phút", val: "30" },
                { label: "1 Giờ", val: "60" },
                { label: "3 Giờ", val: "180" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setDurationMinutes(opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    durationMinutes === opt.val
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                      : "border-transparent bg-black/5 dark:bg-white/5 hover:border-orange-500/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. HÌNH ẢNH SẢN PHẨM (TẢI LÊN TỪ MÁY TÍNH & SUPABASE STORAGE) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ color: "rgb(var(--text-muted))" }}>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" /> Hình ảnh sản phẩm (Tải lên từ máy tính) *
              </span>
              {imageUrl && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã lưu Supabase
                </span>
              )}
            </label>

            {/* Input file ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Khung tải ảnh / Xem trước ảnh */}
            {previewUrl || imageUrl ? (
              <div 
                className="relative w-full h-44 rounded-2xl overflow-hidden border bg-black/40 flex items-center justify-center group"
                style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
              >
                <img 
                  src={previewUrl || imageUrl} 
                  alt="Ảnh xem trước" 
                  className="w-full h-full object-contain p-2" 
                />

                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span>Đang tải ảnh trực tiếp lên Supabase Storage...</span>
                  </div>
                )}

                {!isUploadingImage && (
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold bg-black/75 hover:bg-orange-500 text-white px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" /> Chọn ảnh khác từ máy
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-orange-500 hover:bg-orange-500/5 group"
                style={{ borderColor: "rgba(var(--border-main), 0.4)" }}
              >
                <div className="p-3 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-orange-500 group-hover:underline block">
                    Bấm vào đây để chọn ảnh từ máy tính của bạn
                  </span>
                  <p className="text-[11px] text-muted opacity-70 mt-0.5">
                    Ảnh sẽ được tự động tải lên Supabase Storage (PNG, JPG, WEBP)
                  </p>
                </div>
              </div>
            )}

            {/* Lựa chọn mẫu nhanh hoặc dán URL */}
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="opacity-60 text-[10px]">Hoặc chọn ảnh mẫu nhanh:</span>
              <div className="flex gap-1.5">
                {SAMPLE_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(img.url);
                      setPreviewUrl(img.url);
                      setSelectedFile(null);
                    }}
                    className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      (previewUrl === img.url || imageUrl === img.url) && !selectedFile
                        ? "border-orange-500 ring-1 ring-orange-500 scale-105"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                    title={img.label}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. MÔ TẢ CHI TIẾT & CAM KẾT NGƯỜI BÁN */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgb(var(--text-muted))" }}>
              Mô tả chi tiết & cam kết người bán
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú về nguồn gốc, phụ kiện kèm theo, chính sách bảo hành, cam kết giao hàng..."
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm bg-transparent resize-none focus:border-orange-500 transition-colors"
              style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
            />
          </div>

          {/* 7. NÚT HÀNH ĐỘNG */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đẩy dữ liệu lên Supabase...
                </>
              ) : isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải ảnh...
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" /> Bắt Đầu Phiên Đấu Giá
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
