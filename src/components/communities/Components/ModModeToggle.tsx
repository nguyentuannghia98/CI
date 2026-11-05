"use client";

import React, { useState } from "react";
import { Shield, X, AlertCircle, ChevronLeft } from "lucide-react";
import { useCommunityStore } from "@/lib/Zustard/CommunityStore/CommunityStore";
import { resolveReportAction } from "@/app/actions/ModerationActions";

interface ReportItem {
  id: string;
  type: string;
  reason?: string | null;
  displayContent?: string | null;
  targetId?: string | null;
  reporter?: unknown;
}

interface ModModeToggleProps {
  reports: ReportItem[];
  onRefresh: () => void;
}

export default function ModModeToggle({ reports, onRefresh }: ModModeToggleProps) {
  const isMod = useCommunityStore((state) => state.isMod);
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"MENU" | "REPORTS">("MENU");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isMod) return null;

  const handleResolve = async (reportId: string, type: string, action: 'keep' | 'delete') => {
    setIsProcessing(true);
    setErrorMsg("");
    try {
      const res = await resolveReportAction({
        reportId,
        type: type === 'post' ? 'post' : 'comment',
        action,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Xử lý báo cáo thất bại.");
        return;
      }

      onRefresh();
    } catch (error) {
      console.error("Mod Error:", error);
      setErrorMsg("Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-md relative"
      >
        <Shield size={18} />
        <span className="hidden md:inline">Mod Tools</span>
        {reports.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {reports.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className={`fixed top-0 right-0 z-[101] h-screen w-80 bg-white shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                {activeView !== "MENU" && (
                  <button onClick={() => setActiveView("MENU")} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                )}
                <Shield size={20} className="text-orange-600" />
                <span>{activeView === "MENU" ? "Quản trị" : "Báo cáo vi phạm"}</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            <div className="p-4">
              {activeView === "MENU" ? (
                <button
                  type="button"
                  onClick={() => setActiveView("REPORTS")}
                  className="w-full text-left bg-gray-50 p-4 rounded-xl border hover:border-orange-200 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-700"><AlertCircle size={16} className="text-red-500" /> Báo cáo chờ xử lý</div>
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">{reports.length}</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  {errorMsg && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{errorMsg}</p>
                  )}
                  {reports.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-10">Không có báo cáo nào</p>
                  ) : reports.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-3 text-xs shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-orange-600 font-bold uppercase">{item.type}</span>
                        <span className="text-gray-500">@{(item.reporter as { username?: string | null } | null | undefined)?.username}</span>
                      </div>
                      <p className="font-semibold mb-1">Lý do: {item.reason}</p>
                      <div className="bg-gray-50 p-2 rounded mb-2 italic text-gray-600">&quot;{item.displayContent}&quot;</div>
                      <div className="flex gap-2">
                        <button disabled={isProcessing} onClick={() => handleResolve(item.id, item.type, 'keep')} className="flex-1 bg-green-600 text-white py-1.5 rounded font-medium disabled:opacity-50">GIỮ</button>
                        <button disabled={isProcessing} onClick={() => handleResolve(item.id, item.type, 'delete')} className="flex-1 bg-red-50 text-red-600 border border-red-100 py-1.5 rounded font-medium disabled:opacity-50">XÓA</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}