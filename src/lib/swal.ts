import Swal from "sweetalert2";

// Cấu hình SweetAlert2 Dark Gaming Theme cao cấp đồng bộ với NexLoot
export const arenaSwal = Swal.mixin({
  background: "#0f172a", // slate-900
  color: "#f8fafc",
  confirmButtonColor: "#f97316", // orange-500
  cancelButtonColor: "#334155", // slate-700
  customClass: {
    container: "!z-[999999]",
    popup: "rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl",
    title: "font-black text-xl text-white",
    htmlContainer: "text-slate-300 text-sm leading-relaxed",
    confirmButton: "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25",
    cancelButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-600 transition-all",
  },
  didOpen: (popup) => {
    const container = popup.closest(".swal2-container") as HTMLElement | null;
    if (container) {
      container.style.zIndex = "999999";
      container.style.pointerEvents = "auto";
    }
  },
});

/**
 * Hộp thoại SweetAlert2 xác nhận bỏ cuộc khi đang thi đấu mảnh ghép
 */
export const showForfeitAlert = (roomTitle?: string, storeName?: string) => {
  return Swal.fire({
    title: "Xác nhận bỏ cuộc?",
    html: `
      <div class="text-left space-y-2 text-xs">
        <p class="text-slate-300">
          Bạn đang tham gia trận đấu tranh giải sản phẩm 
          <strong class="text-orange-400">${roomTitle || "sản phẩm"}</strong> của Shop <strong>${storeName || "Shop"}</strong>.
        </p>
        <div class="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 mt-2">
          <strong>⚠️ CẢNH BÁO QUAN TRỌNG:</strong><br />
          Nếu bạn bỏ cuộc giữa chừng, <strong>Thẻ tham gia sẽ BỊ MẤT và KHÔNG ĐƯỢC HOÀN LẠI</strong> vào tài khoản!
        </div>
      </div>
    `,
    icon: "warning",
    iconColor: "#f43f5e", // rose-500
    showCancelButton: true,
    confirmButtonText: "Bỏ Cuộc (Mất Thẻ)",
    cancelButtonText: "Tiếp Tục Thi Đấu",
    confirmButtonColor: "#e11d48", // rose-600
    cancelButtonColor: "#334155", // slate-700
    background: "#0f172a",
    color: "#f8fafc",
    customClass: {
      container: "!z-[999999]",
      popup: "rounded-3xl border border-rose-500/40 shadow-2xl shadow-rose-950/60",
      title: "font-black text-xl text-white",
      confirmButton: "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
    },
    didOpen: (popup) => {
      const container = popup.closest(".swal2-container") as HTMLElement | null;
      if (container) {
        container.style.zIndex = "999999";
        container.style.pointerEvents = "auto";
      }
    },
  });
};

/**
 * Hộp thoại SweetAlert2 xác nhận rời phòng chờ
 */
export const showLeaveRoomAlert = (roomTitle?: string) => {
  return Swal.fire({
    title: "Rời phòng chờ?",
    html: `
      <p class="text-xs text-slate-300">
        Bạn có chắc muốn rời phòng chờ của <strong class="text-orange-400">${roomTitle || "phòng"}</strong>?<br />
        <span class="text-amber-400 font-semibold block mt-1">Lưu ý: Rời phòng trước khi bắt đầu sẽ không hoàn lại Thẻ đã dùng.</span>
      </p>
    `,
    icon: "warning",
    iconColor: "#f59e0b",
    showCancelButton: true,
    confirmButtonText: "Xác Nhận Rời",
    cancelButtonText: "Ở Lại Chờ",
    confirmButtonColor: "#ea580c",
    cancelButtonColor: "#334155",
    background: "#0f172a",
    color: "#f8fafc",
    customClass: {
      container: "!z-[999999]",
      popup: "rounded-3xl border border-slate-700 shadow-2xl",
      title: "font-black text-lg text-white",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs",
    },
    didOpen: (popup) => {
      const container = popup.closest(".swal2-container") as HTMLElement | null;
      if (container) {
        container.style.zIndex = "999999";
        container.style.pointerEvents = "auto";
      }
    },
  });
};

export default Swal;
