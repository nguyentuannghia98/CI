"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Đang tải..." }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-3 border border-gray-100 shadow-sm"
    >
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
