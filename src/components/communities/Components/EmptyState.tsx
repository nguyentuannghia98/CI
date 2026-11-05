"use client";

import React from "react";

export default function EmptyState({
  message = "Không có dữ liệu.",
}: {
  message?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
      <div className="text-4xl">📭</div>
      <p className="mt-3 text-gray-600">{message}</p>
    </div>
  );
}
