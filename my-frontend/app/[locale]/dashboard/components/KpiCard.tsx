"use client";

import { TrendingUp, TrendingDown, Building2, BadgeEuro, CreditCard, ShoppingCart, Users, Activity, BarChart3 } from "lucide-react";

export interface KpiData {
  title: string;
  value: string;
  trend?: string;
  trendLabel?: string;
  variant?: "pink" | "blue" | "green" | "amber";
  iconType?: "building" | "euro" | "card" | "cart" | "users" | "activity" | string;
}

const THEMES = {
  pink: {
    bg: "bg-pink-50 border-pink-100",
    iconBg: "bg-pink-500",
    iconColor: "text-white",
    trendText: "text-pink-600",
  },
  blue: {
    bg: "bg-blue-50 border-blue-100",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    trendText: "text-blue-600",
  },
  green: {
    bg: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    trendText: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    trendText: "text-amber-600",
  }
};

export default function KpiCard({ data }: { data: KpiData }) {
  if (!data) return null;

  const theme = THEMES[data.variant || "blue"] || THEMES.blue;
  const trend = data.trend || "";
  const isPositive = trend.includes("+") || (!trend.includes("-") && trend !== "0%");

  const renderIcon = () => {
    const props = { className: "w-5 h-5" };
    switch (data.iconType) {
      case "building": return <Building2 {...props} />;
      case "euro": return <BadgeEuro {...props} />;
      case "card": return <CreditCard {...props} />;
      case "cart": return <ShoppingCart {...props} />;
      case "users": return <Users {...props} />;
      case "activity": return <Activity {...props} />;
      default: return <BarChart3 {...props} />;
    }
  };

  return (
    <div className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${theme.bg}`}>
      
      <div className="flex items-center gap-4">
        {/* Icon Sqr */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${theme.iconBg} ${theme.iconColor}`}>
          {renderIcon()}
        </div>

        {/* Labels */}
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
            {data.title}
          </span>
          <span className="text-2xl font-bold text-slate-900 leading-tight">
            {data.value}
          </span>
        </div>
      </div>

      {/* Trend Area */}
      {(data.trend || data.trendLabel) && (
        <div className="flex flex-col items-end">
          {data.trend && (
            <div className={`flex items-center gap-1 font-bold text-[14px] ${theme.trendText}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {data.trend}
            </div>
          )}
          {data.trendLabel && (
            <span className="text-[11px] font-medium text-slate-400">
              {data.trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
