import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Nợ kỹ thuật có sẵn (chủ yếu ở code cũ, ngoài phạm vi review bảo mật).
      // Hạ xuống mức cảnh báo để không chặn `next build`, nhưng vẫn hiển thị
      // khi chạy `npm run lint` để siết dần.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
