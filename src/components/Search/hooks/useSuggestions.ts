import { useEffect, useState } from "react";
import {
  fetchProductsByTitle,
  fetchUsersByName,
  fetchTags,
  fetchCommunities,
  normalizeSuggestions,
} from "@/components/Search/hooks/searchService";
import type { SuggestionItem } from "@/components/Search/types/search";

export function useSuggestions(query: string, debounceMs = 300) {
  const [results, setResults] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Biến để kiểm soát việc cập nhật state (chống Race Condition)
    let isMounted = true;

    // Nếu query rỗng, xóa kết quả và thoát sớm
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Sử dụng Promise.allSettled để tránh việc 1 API lỗi làm hỏng toàn bộ kết quả
        const responses = await Promise.allSettled([
          fetchProductsByTitle(query, 5),
          fetchUsersByName(query, 5),
          fetchTags(query, 10),
          fetchCommunities(query, 5),
        ]);

        // Kiểm tra xem đây có còn là kết quả của lần gõ phím mới nhất không
        if (!isMounted) return;

        // Trích xuất dữ liệu từ responses, nếu fail thì trả về mảng rỗng []
        const products = responses[0].status === "fulfilled" ? responses[0].value : [];
        const users = responses[1].status === "fulfilled" ? responses[1].value : [];
        const tags = responses[2].status === "fulfilled" ? responses[2].value : [];
        const communities = responses[3].status === "fulfilled" ? responses[3].value : [];

        // Log chi tiết lỗi của từng API vào Console để bạn dễ debug
        responses.forEach((res, index) => {
          if (res.status === "rejected") {
            const apiNames = ["Products", "Users", "Tags", "Communities"];
            console.error(`Search API Fail (${apiNames[index]}):`, res.reason);
          }
        });

        const uniqueTags = Array.from(new Set(tags));
        const normalized = normalizeSuggestions({
          products,
          users,
          tags: uniqueTags,
          communities,
        });

        setResults(normalized);
      } catch (error) {
        // Lỗi này chỉ bắn ra nếu có lỗi logic cực nặng trong code xử lý dữ liệu
        console.error("Critical Search Logic Error:", error);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Thiết lập Debounce
    const timer = setTimeout(() => {
      fetchAll();
    }, debounceMs);

    // Cleanup function: Chạy khi query thay đổi hoặc component unmount
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, debounceMs]); // Loại bỏ fetchAll khỏi dependency vì ta đã đưa logic vào trong

  return { results, loading };
}