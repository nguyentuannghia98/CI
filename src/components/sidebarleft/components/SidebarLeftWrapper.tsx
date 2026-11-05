'use client';
import React from 'react';

type SidebarLeftWrapperProps = {
  children?: React.ReactNode;
};

export default function SidebarLeftWrapper({ children }: SidebarLeftWrapperProps) {
  return (
    <div className="h-full bg-white border-r-[0.5px] border-gray-300">
      {children}
    </div>
  );
}
