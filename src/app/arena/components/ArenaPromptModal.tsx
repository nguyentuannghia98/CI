"use client";

import React from "react";
import { AlertTriangle, AlertCircle, X, Flag, Ticket, Shield } from "lucide-react";

export interface ArenaPromptModalProps {
  isOpen: boolean;
  type?: "danger" | "warning" | "info";
  title: string;
  badge?: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ArenaPromptModal({
  isOpen,
  type = "danger",
  title,
  badge = "Cảnh Báo",
  message,
  detail,
  confirmText = "Xác Nhận Bỏ Cuộc",
  cancelText = "Tiếp Tục Thi Đấu",
  onConfirm,
  onCancel,
}: ArenaPromptModalProps) {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-white space-y-4 border ${
          isDanger
            ? "bg-slate-900/95 border-rose-500/50 shadow-rose-950/50"
            : isWarning
            ? "bg-slate-900/95 border-amber-500/50 shadow-amber-950/50"
            : "bg-slate-900/95 border-cyan-500/50 shadow-cyan-950/50"
        }`}
      >
        {/* Nút đóng góc phải nếu có onCancel */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        )}

        {/* Icon nổi bật với hiệu ứng phát sáng */}
        <div className="flex justify-center pt-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl ${
              isDanger
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-500/20 animate-pulse"
                : isWarning
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/20 animate-pulse"
                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-cyan-500/20"
            }`}
          >
            {isDanger ? (
              <Flag size={34} />
            ) : isWarning ? (
              <AlertTriangle size={34} />
            ) : (
              <AlertCircle size={34} />
            )}
          </div>
        </div>

        {/* Tiêu đề & Nội dung */}
        <div className="text-center space-y-1.5">
          <span
            className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider inline-block border ${
              isDanger
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : isWarning
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
            }`}
          >
            {badge}
          </span>
          <h3 className="text-xl font-black text-white mt-1">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">{message}</p>
        </div>

        {/* Khung chi tiết / cảnh báo mất thẻ */}
        {detail && (
          <div
            className={`p-3.5 rounded-2xl border text-left space-y-1 text-xs ${
              isDanger
                ? "bg-rose-950/40 border-rose-500/30 text-rose-200"
                : isWarning
                ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
                : "bg-slate-800/80 border-slate-700 text-slate-200"
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertCircle size={15} className="shrink-0" />
              <span>Quy định sàn đấu:</span>
            </div>
            <p className="leading-snug">{detail}</p>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex items-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Shield size={14} className="text-emerald-400" />
              <span>{cancelText}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
              isDanger
                ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/30"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black shadow-orange-500/30"
            }`}
          >
            {isDanger && <Flag size={14} />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArenaPromptModal;

