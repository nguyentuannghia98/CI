"use client";

import React, { useState } from "react";
import { Plus, Loader2, Tag as TagIcon, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommunityTag } from "@/app/actions/ComunnitiesActions/Communities"; // Import action

export default function CreateTagButton({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tagName, setTagName] = useState("");

  // =========================
  // MUTATION: TẠO TAG MỚI (Dùng Server Action)
  // =========================
  const { mutate: createTag, isPending, isSuccess, error: mutationError } = useMutation({
    mutationFn: async (name: string) => {
      const result = await createCommunityTag(communityId, name);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-tags", communityId] });
      setTagName("");
      // Đóng modal sau khi thành công
      setTimeout(() => setOpen(false), 800);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagName.trim() && !isPending) {
      createTag(tagName);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-700 
                   hover:bg-orange-100 transition-all font-normal text-sm active:scale-95 cursor-pointer"
      >
        <Plus size={18} strokeWidth={2} />
        Tạo Tag
      </button>

      {open && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-800">
                <TagIcon size={18} className="text-orange-600" />
                <h2 className="font-normal">Thêm Tag mới</h2>
              </div>
              <button 
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                disabled={isPending}
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="tagName" className="text-xs font-normal uppercase text-gray-500 mb-1.5 block ml-1">
                    Tên nhãn dán
                  </label>
                  <input
                    id="tagName"
                    autoFocus
                    type="text"
                    placeholder="Ví dụ: Thảo luận, Hỏi đáp..."
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none transition-all font-normal"
                    maxLength={20}
                    disabled={isPending || isSuccess}
                  />
                </div>

                {isSuccess && (
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-normal flex items-center gap-2 animate-bounce">
                    ✨ Đã tạo thành công!
                  </div>
                )}

                {mutationError && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-normal">
                    ⚠️ {mutationError.message}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-normal text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  disabled={isPending}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={!tagName.trim() || isPending || isSuccess}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-normal 
                             hover:bg-orange-700 transition-all flex items-center gap-2 
                             disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Xác nhận tạo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}