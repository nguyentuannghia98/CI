/**
 * Xử lý URL ảnh an toàn, chống lỗi src="" gây re-download trang
 */
export const getSafeImageUrl = (
  url: string | null | undefined, 
  fallback: string = "/placeholder.png"
): string => {
  // 1. Kiểm tra nếu url không tồn tại hoặc chỉ là chuỗi rỗng/khoảng trắng
  if (!url || typeof url !== "string" || url.trim() === "") {
    return fallback;
  }

  // 2. Xử lý trường hợp chuỗi là mảng JSON (đặc thù của Supabase/PostgreSQL)
  if (url.startsWith("[")) {
    try {
      const parsed = JSON.parse(url);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] || fallback;
      }
    } catch {
      return fallback;
    }
  }

  // 3. Xử lý chuỗi phân tách bằng dấu phẩy
  if (url.includes(",")) {
    const firstImg = url.split(",")[0].trim();
    return firstImg !== "" ? firstImg : fallback;
  }

  return url.trim();
};