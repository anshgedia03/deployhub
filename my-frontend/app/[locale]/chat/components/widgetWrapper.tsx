"use client";

import React from "react";

interface WidgetWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function WidgetWrapper({ children, title, subtitle }: WidgetWrapperProps) {
  return (
    <div className="flex flex-col gap-4 w-full mt-2">

      {/* Chart Card */}
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col">

        {/* Title and Subtitle inside the card */}
        {(title || subtitle) && (
          <div className="mb-4 flex flex-col gap-1">
            {title && <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[14px] text-gray-500">{subtitle}</p>}
          </div>
        )}

        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
