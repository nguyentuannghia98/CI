import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware xử lý:
 * 1. Làm mới (Refresh) Session tự động để chống trôi.
 * 2. Bảo vệ các Route riêng tư (Profile, Dashboard, v.v.).
 * 3. Chuyển hướng về Home kèm Flag mở AuthModal nếu truy cập trái phép.
 */
export async function middleware(request: NextRequest) {
  // 1. Tạo response ban đầu
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Khởi tạo Supabase Server Client (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Cập nhật cho Request để Server Components phía sau đọc được ngay
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Cập nhật cho Response để Browser lưu Cookie mới nhất
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Kiểm tra User (Sử dụng getUser để đảm bảo token hợp lệ và refresh nếu cần)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 4. Định nghĩa các nhóm Route
  // Vì bạn dùng AuthModal nên không cần kiểm tra isAuthPage (/login, /register) nữa
  const isProtectedRoute =
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/settings");

  // 5. Logic điều hướng (Redirect)
  if (!user && isProtectedRoute) {
    const originPath = url.pathname;
    
    // Đẩy về trang chủ thay vì /login
    url.pathname = "/"; 
    
    // Gắn flag để Client-side biết cần mở Modal và quay lại trang cũ sau khi login
    url.searchParams.set("auth", "login");
    url.searchParams.set("next", originPath);
    
    return NextResponse.redirect(url);
  }

  // Nếu user đã có mà cố tình vào các path cũ (nếu lỡ còn link /login) thì đẩy về home
  const isLegacyAuthPage = url.pathname === "/login" || url.pathname === "/register";
  if (user && isLegacyAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

// 6. Cấu hình Matcher: Chặn tất cả trừ file tĩnh và ảnh
export const config = {
  matcher: [
    /*
     * Match tất cả các đường dẫn trừ:
     * - api (có thể xử lý auth riêng trong route handler)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap, v.v.
     * - Các file media: svg, png, jpg, jpeg, gif, webp
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};