"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, ShieldAlert, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
// ✅ Thay đổi import từ thư viện cũ sang file client tập trung của bạn
import { createClient } from "@/lib/supabase/client";

interface ReportReason {
  id: string;
  label: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  communityName: string | null;
  targetType?: 'product' | 'user';
  isLoading?: boolean; 
}

export const ReportModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  communityName,
  targetType = 'product',
  isLoading = false 
}: ReportModalProps) => {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [step, setStep] = useState(1);
  const [fetchingReasons, setFetchingReasons] = useState(true);
  
  // ✅ Thay đổi cách khởi tạo sang useMemo hoặc gọi trực tiếp từ hàm createClient
  const supabase = createClient();

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        setFetchingReasons(true);
        const { data, error } = await supabase
          .from('report_reasons')
          .select('id, label')
          .eq('is_active', true)
          .or(`target_type.eq.${targetType},target_type.eq.both`)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setReasons(data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách lý do:", err);
      } finally {
        setFetchingReasons(false);
      }
    };

    if (isOpen) {
      fetchReasons();
      setStep(1);
      setSelectedReason(null);
      setDetails("");
    }
  }, [isOpen, targetType, supabase]);

  const handleNext = () => setStep(2);
  const handleBack = () => !isLoading && setStep(1); 

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={!isLoading ? onClose : undefined} 
            className={`fixed inset-0 bg-black/60 z-[100] backdrop-blur-[2px] ${!isLoading ? 'cursor-pointer' : 'cursor-default'}`} 
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[500px] rounded-[28px] shadow-2xl z-[101] overflow-hidden border"
            style={{ 
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgba(var(--border-main), 0.1)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}>
              <div className="flex items-center gap-2">
                {step === 2 && (
                  <button 
                    disabled={isLoading}
                    onClick={handleBack} 
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full mr-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} style={{ color: 'rgb(var(--text-main))' }}/>
                  </button>
                )}
                <ShieldAlert className="text-red-500" size={20} />
                <h2 className="text-[17px] font-black uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
                  {step === 1 ? "Báo cáo vi phạm" : "Thông tin chi tiết"}
                </h2>
              </div>
              <button 
                disabled={isLoading}
                onClick={onClose} 
                className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <X size={20} style={{ color: 'rgb(var(--text-muted))' }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 1 ? (
                <>
                  <p className="text-[14px] mb-5 font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                    Vui lòng chọn lý do phù hợp nhất:
                  </p>
                  {fetchingReasons ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" /></div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {reasons.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedReason(r.label)}
                          className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-all cursor-pointer ${
                            selectedReason === r.label 
                              ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                              : "border-transparent hover:bg-orange-500/10"
                          }`}
                          style={{ 
                            backgroundColor: selectedReason === r.label ? undefined : 'rgba(var(--border-main), 0.05)',
                            color: selectedReason === r.label ? 'white' : 'rgb(var(--text-main))'
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                    Lý do: <span className="font-black uppercase text-orange-500">{selectedReason}</span>
                  </p>
                  <textarea
                    autoFocus
                    disabled={isLoading}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Vui lòng cung cấp thêm thông tin, bằng chứng (link ảnh, mô tả hành vi...)"
                    className="w-full h-32 p-4 rounded-2xl text-[14px] focus:outline-none border-2 focus:border-orange-500 transition-all resize-none disabled:opacity-60"
                    style={{ 
                      backgroundColor: 'rgba(var(--border-main), 0.05)',
                      borderColor: 'transparent',
                      color: 'rgb(var(--text-main))'
                    }}
                  />
                </div>
              )}
              
              <div className="flex gap-3 p-4 rounded-2xl border mt-2" 
                style={{ 
                  backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                  borderColor: 'rgba(245, 158, 11, 0.2)' 
                }}
              >
                <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium leading-snug" style={{ color: 'rgb(var(--text-main))' }}>
                  Báo cáo của bạn sẽ được đội ngũ <span className="text-orange-500 font-bold">{communityName || 'quản trị viên'}</span> kiểm duyệt kỹ lưỡng.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 flex justify-end gap-2 border-t" style={{ backgroundColor: 'rgba(var(--border-main), 0.02)', borderColor: 'rgba(var(--border-main), 0.1)' }}>
              <button 
                disabled={isLoading}
                onClick={onClose} 
                className="px-5 py-2 text-[14px] font-black uppercase hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Hủy
              </button>
              
              {step === 1 ? (
                <button
                  disabled={!selectedReason || fetchingReasons}
                  onClick={handleNext}
                  className="flex items-center gap-1 px-6 py-2 bg-orange-500 text-white rounded-full font-black uppercase text-[13px] disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  Tiếp theo <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  disabled={isLoading}
                  onClick={() => selectedReason && onSubmit(selectedReason, details)}
                  className="flex items-center justify-center min-w-[140px] px-8 py-2 bg-red-500 text-white rounded-full font-black uppercase text-[13px] hover:bg-red-600 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi báo cáo"
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

ReportModal.displayName = "ReportModal";