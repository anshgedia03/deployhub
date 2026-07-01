"use client";
import KpiCard from "./KpiCard";

interface KpiGridProps {
  data: any[];
}

export default function KpiGrid({ data }: KpiGridProps) {
  if (!data || data.length === 0) return null;

  const variants: ("pink" | "blue" | "green" | "amber")[] = ["blue", "pink", "green", "amber"];
  const iconTypes: ("building" | "euro" | "card" | "cart" | "users" | "activity")[] = ["activity", "users", "euro", "building", "card", "cart"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full h-full">
      {data.slice(0, 4).map((kpi, idx) => (
        <div key={idx} className="h-full">
          <KpiCard data={{
            title: kpi.title || kpi.name || "Metric",
            value: typeof kpi.value === 'number' ? kpi.value.toLocaleString() : String(kpi.value || "0"),
            trend: kpi.change || kpi.trend || "0%",
            trendLabel: kpi.changeLabel || kpi.trendLabel || "vs last period",
            variant: variants[idx % variants.length],
            iconType: iconTypes[idx % iconTypes.length]
          }} />
        </div>
      ))}
    </div>
  );
}
