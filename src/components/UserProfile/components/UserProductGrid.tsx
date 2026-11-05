import Link from "next/link";
import Image from "next/image";

// Định nghĩa Interface cho Product
export interface UserProductItem {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
}

export function UserProductGrid({ 
  products 
}: { 
  products: UserProductItem[] 
}) {
  if (products.length === 0) {
    return (
      <p className="text-gray-500 text-center py-10">
        Người này chưa đăng sản phẩm nào.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((p) => (
        <Link 
          href={`/deal/${p.id}`} 
          key={p.id} 
          className="group rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all bg-white block"
        >
          {/* Container cho ảnh với hiệu ứng zoom nhẹ khi hover */}
          <div className="relative w-full h-40 bg-gray-50 overflow-hidden">
            <Image 
              src={p.image_url ?? "/default-product.png"} 
              alt={p.title || "Product image"} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-300" 
              unoptimized 
            />
          </div>

          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                {p.category || "Chưa phân loại"}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[40px] leading-tight group-hover:text-blue-600 transition-colors">
              {p.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}