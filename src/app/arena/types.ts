export interface Participant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
}

export interface ArenaCreator {
  id?: string;
  name: string;
  avatar: string;
  verified?: boolean;
}

export interface ArenaRoom {
  id: string;
  title: string;
  productImage: string;
  productValue: number;      // Ví dụ: 100000 (100k)
  voucherCost: number;       // Giá trị 1 Voucher yêu cầu (vd: 10000 - 10k)
  maxParticipants: number;   // Số lượng người chơi tối đa (vd: 150)
  currentParticipants: Participant[];
  status: "WAITING" | "FULL" | "COMPLETED" | "CANCELLED";
  expiresAt: number;         // Thời gian hết hạn đếm ngược (timestamp)
  winner?: Participant;      // Người thắng (nếu có)
  storeName: string;         // Tên shop đăng sản phẩm
  creator?: ArenaCreator;    // Thông tin người tạo phòng / sàn đấu
}

export interface UserVoucher {
  id: string;
  code: string;
  value: number;             // Giá trị voucher (10k)
  isUsed: boolean;
}
