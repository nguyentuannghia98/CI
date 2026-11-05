import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold">Không tìm thấy trang</h2>
      <p className="text-sm opacity-70">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link
        href="/"
        className="rounded-full border px-5 py-2 text-sm transition-colors hover:opacity-80"
        style={{ borderColor: "rgba(var(--border-main), 0.5)" }}
      >
        Về trang chủ
      </Link>
    </div>
  );
}
