import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  category: z.string().min(1, "Category is required"),
  isPrivate: z.boolean(),
  condition: z.enum([
    "brand_new",
    "new_open_box",
    "used_like_new",
    "used_good",
    "as_is",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  specs: z.array(z.object({ key: z.string(), value: z.string() })),
  videoUrl: z.string().url("Invalid video URL").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(), // ✅ mới thêm
  price: z.number().min(0, "Price must be positive"),
  enableOffers: z.boolean(),
  minOffer: z.number().min(0),
  quantity: z.number().min(1),
  sku: z.string().optional(),
  returnPolicy: z.enum(["no_returns", "7_days", "14_days"]).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
