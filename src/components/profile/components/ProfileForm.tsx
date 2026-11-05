"use client";

import type { UserData, ProfileFormData } from "@/components/profile/type/types";
import React from "react";

export default function ProfileForm({
  isEditing,
  user,
  formData,
  setFormData,
}: {
  isEditing: boolean;
  user: UserData;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
}) {
  // Trạng thái hiển thị (View Mode)
  if (!isEditing) {
    return (
      <div className="mt-8 space-y-6 px-1">
        {[
          { label: "Email", value: user.email, placeholder: "Chưa cập nhật" },
          { label: "Địa chỉ", value: user.address, placeholder: "Chưa cập nhật" },
          { label: "SĐT", value: user.phone, placeholder: "Chưa có" },
          { label: "Ngày sinh", value: user.birth, placeholder: "Chưa cập nhật" },
        ].map((item, index) => (
          <div 
            key={index} 
            className="flex flex-col pb-3 border-b" 
            style={{ borderColor: 'rgba(var(--border-main), 0.3)' }}
          >
            <span 
              className="text-[12px] font-normal tracking-[0.5px]"
              style={{ color: 'rgb(var(--text-muted))' }} // Sử dụng text-muted cho label
            >
              {item.label}
            </span>
            <span 
              className="text-[16px] mt-1 whitespace-pre-line font-normal"
              style={{ color: 'rgb(var(--text-main))' }} // Sử dụng text-main cho nội dung
            >
              {item.value || item.placeholder}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Trạng thái chỉnh sửa (Edit Mode)
  return (
    <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Trường Email - Read Only */}
      <div className="relative group opacity-70">
        <div 
          className="relative rounded-t-[4px] border-b cursor-not-allowed"
          style={{ 
            backgroundColor: 'rgba(var(--bg-card), 0.5)', 
            borderColor: 'rgb(var(--border-main))' 
          }}
        >
          <label 
            className="block pt-2 px-4 text-[12px] font-normal leading-none"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            Email (Liên hệ)
          </label>
          <input
            type="text"
            value={user.email || ""}
            disabled
            className="w-full bg-transparent px-4 pb-2 pt-1 text-[16px] outline-none font-normal"
            style={{ color: 'rgb(var(--text-main))' }}
          />
        </div>
        <p className="mt-1 px-4 text-[10px] font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
          Email không thể thay đổi trực tiếp
        </p>
      </div>

      {/* Các trường nhập liệu ngắn */}
      {Object.entries({
        username: "Tên người dùng",
        address: "Địa chỉ",
        phone: "Số điện thoại",
        birth: "Ngày sinh",
      }).map(([key, label]) => {
        const typedKey = key as keyof ProfileFormData;
        const isBirth = key === "birth";

        return (
          <div key={key} className="relative group">
            <div 
              className="relative rounded-t-[4px] border-b transition-colors focus-within:border-b-2"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))', 
                borderColor: 'rgb(var(--border-main))'
              }}
            >
              <label 
                className="block pt-2 px-4 text-[12px] font-normal leading-none"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                {label}
              </label>
              <input
                type={isBirth ? "date" : "text"}
                value={formData[typedKey] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [typedKey]: e.target.value,
                  }))
                }
                className={`w-full bg-transparent px-4 pb-2 pt-1 text-[16px] outline-none font-normal ${isBirth ? "cursor-pointer" : ""}`}
                style={{ color: 'rgb(var(--text-main))' }}
                placeholder=" "
              />
            </div>
            
            {isBirth && (
              <p className="mt-1 px-4 text-[11px] font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
                Định dạng: Ngày / Tháng / Năm
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}