"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, description, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-1.5 transition-all hover:border-[#8B5CF6]/30 hover:shadow-md">
      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-3">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[12px] font-bold mb-1 px-1.5 py-0.5 rounded-full",
            trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      {description && <p className="text-[12px] text-slate-400 font-medium">{description}</p>}
    </div>
  );
}

export default function StatCards({ data }: { data: StatCardProps[] }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {data.map((stat, i) => <StatCard key={i} {...stat} />)}
    </div>
  );
}
