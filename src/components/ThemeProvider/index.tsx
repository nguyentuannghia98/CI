"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// SỬA LỖI: Import trực tiếp từ 'next-themes' thay vì đường dẫn sâu /dist/types
import { type ThemeProviderProps } from "next-themes";

/**
 * Xuất Named Export để Layout.tsx nhận diện được { ThemeProvider }
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}