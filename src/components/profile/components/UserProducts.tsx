"use client";

import Image from "next/image";
import { Trash2, Loader2 } from "lucide-react";
import type { Product } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { UserData } from "@/components/profile/type/types";

/**
 * Minimal router-like interface used by this component.
 * Keeps the prop typed without depending on a specific router implementation.
 */
type RouterLike = {
  push: (url: string) => void;
  replace?: (url: string) => void;
  back?: () => void;
};

export default function UserProducts({
  products,
  loading,
  user,
  currentUser,
  router,
  deleting,
  onDelete,
}: {
  products: Product[];
  loading: boolean;
  user: UserData;
  currentUser: User | null;
  router: RouterLike;
  deleting: string | null;
  onDelete: (productId: string, imageUrl?: string) => void;
}) {
  if (loading) return <p className="text-center">Đang tải...</p>;
  if (products.length === 0)
    return <p className="text-center">Bạn chưa đăng sản phẩm nào.</p>;

  const isOwner = currentUser?.id === user.id;

  return (
    <>
      <h3 className="text-xl font-semibold mt-10 mb-4">Sản phẩm đã đăng</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {products.map((p) => {
          const imageUrl =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : "/no-image.jpg";

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/deal/${p.id}`)}
              className="border rounded-xl shadow hover:shadow-md cursor-pointer relative group overflow-hidden"
            >
              {/* ẢNH */}
              <Image
                src={imageUrl}
                alt={p.title}
                width={400}
                height={300}
                className="object-cover w-full h-40"
              />

              {/* NỘI DUNG */}
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-sm mt-1 text-gray-600">
                  {p.price ? p.price.toLocaleString() + "₫" : "Chưa có giá"}
                </p>
              </div>

              {/* 🗑️ NÚT XOÁ – CHỈ HIỆN KHI LÀ CHỦ PROFILE */}
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id, imageUrl);
                  }}
                  disabled={deleting === p.id}
                  className={`
                    absolute top-2 right-2 z-20
                    flex items-center justify-center
                    w-9 h-9 rounded-full
                    text-white
                    transition
                    ${
                      deleting === p.id
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }
                  `}
                  title="Xoá sản phẩm"
                >
                  {deleting === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
