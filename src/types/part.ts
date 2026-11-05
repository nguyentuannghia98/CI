export type PartCategory =
  | 'CPU'
  | 'GPU'
  | 'Motherboard'
  | 'RAM'
  | 'Storage'
  | 'PSU'
  | 'Case'
  | 'Cooler'
  | 'Monitor'
  | 'Other';

export interface PCPart {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: PartCategory;
  productUrl: string;
}

// ✅ Thêm dòng sau để đảm bảo là module
export {}; // 👈 hoặc thêm 1 export bất kỳ nếu chưa dùng
