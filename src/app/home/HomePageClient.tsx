"use client";

import dynamic from "next/dynamic";
import HeroSection from "./components/HeroSection";
import DestinationsSection from "./components/DestinationsSection";
import ExperiencesSection from "./components/ExperiencesSection";
import BookingSection from "./components/BookingSection";

// Lazy load Canvas3D: Three.js không cần SSR
const Canvas3D = dynamic(() => import("./components/Canvas3D"), {
  ssr: false,
});

export default function HomePageClient() {
  return (
    <div className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Nền 3D Cyber Nexus & Quantum Rings Cao Cấp */}
      <Canvas3D />

      {/* 2. Nội dung trang chủ */}
      <div className="relative z-10 space-y-12">
        <HeroSection />
        <DestinationsSection />
        <ExperiencesSection />
        <BookingSection />
      </div>
    </div>
  );
}
