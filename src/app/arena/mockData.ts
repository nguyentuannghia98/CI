import { ArenaRoom } from "./types";

export const MOCK_CATEGORIES = [
  "Tất cả",
  "Công nghệ",
  "Trí tuệ",
  "Linh kiện",
  "Đồ sưu tầm",
];

export const MOCK_ROOMS: ArenaRoom[] = [
  {
    id: "room_1",
    title: "Tai nghe Bluetooth Sony WH-1000XM5",
    productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    productValue: 1500000,
    voucherCost: 10000,
    maxParticipants: 150,
    currentParticipants: [
      { id: "u1", name: "MinhTuDev", avatar: "M", joinedAt: Date.now() - 300000 },
      { id: "u2", name: "HoangAnh99", avatar: "H", joinedAt: Date.now() - 120000 },
      { id: "u3", name: "LinhGamer", avatar: "L", joinedAt: Date.now() - 60000 },
    ],
    status: "WAITING",
    expiresAt: Date.now() + 1000 * 60 * 45, // Còn 45 phút
    storeName: "Sony Official Store",
    creator: {
      id: "u1",
      name: "Sony Official Store",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sony",
      verified: true,
    },
  },
  {
    id: "room_2",
    title: "Bàn phím cơ Custom Mod007 v3",
    productImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
    productValue: 1000000,
    voucherCost: 10000,
    maxParticipants: 100,
    currentParticipants: [
      { id: "u4", name: "ThanhTung", avatar: "T", joinedAt: Date.now() - 900000 },
    ],
    status: "WAITING",
    expiresAt: Date.now() + 1000 * 60 * 15, // Còn 15 phút
    storeName: "Akko Gear",
    creator: {
      id: "u2",
      name: "Akko Gear",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=akko",
      verified: true,
    },
  },
  {
    id: "room_3",
    title: "Chuột Gaming Không Dây Logitech G Pro X Superlight",
    productImage: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80",
    productValue: 2500000,
    voucherCost: 20000,
    maxParticipants: 50,
    currentParticipants: Array.from({ length: 50 }, (_, i) => ({
      id: `full_u${i}`,
      name: `User_${i + 1}`,
      avatar: "U",
      joinedAt: Date.now() - i * 10000,
    })),
    status: "FULL",
    expiresAt: Date.now() - 1000 * 60 * 5,
    storeName: "Logitech G Store",
    creator: {
      id: "u3",
      name: "Logitech G Store",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=logitech",
      verified: true,
    },
  },
  {
    id: "room_4",
    title: "Mô hình Gundam RX-78-2 PG Unchained",
    productImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80",
    productValue: 4500000,
    voucherCost: 50000,
    maxParticipants: 200,
    currentParticipants: [],
    status: "CANCELLED",
    expiresAt: Date.now() - 1000 * 60 * 60,
    storeName: "Hobby World",
    creator: {
      id: "u4",
      name: "Hobby World",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=gundam",
      verified: true,
    },
  },
];
