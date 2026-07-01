"use client";

import React from "react";
import UniversalChart from "@/app/[locale]/dashboard/components/UniversalChart";
import GeoMapChart from "@/app/[locale]/dashboard/components/GeoMapChart";
import KpiCard from "@/app/[locale]/dashboard/components/KpiCard";
import DataTable from "@/app/[locale]/dashboard/components/DataTable";
import HeatmapChart from "@/app/[locale]/dashboard/components/HeatmapChart";
import { WidgetWrapper } from "./widgetWrapper";
import { LayoutDashboard, Plus } from "lucide-react";

interface ChatChartRendererProps {
    viz: any;
    data: any[];
    isDashboard?: boolean;
    onDashboard?: boolean;
    onToggleDashboard?: () => void;
    isLoading?: boolean;
}

export function ChatChartRenderer({
    viz,
    data,
    isDashboard,
    onDashboard,
    onToggleDashboard,
    isLoading
}: ChatChartRendererProps) {
    if (!viz || !data || data.length === 0) return null;

    const Wrapper = isDashboard ? React.Fragment : WidgetWrapper;
    // @ts-ignore
    const wrapperProps = isDashboard ? {} : { title: viz.chartTitle || viz.title || 'Data Visualization' };

    let chartType = (viz.chartType || viz.chart_type || 'bar').toLowerCase();
    const chartTitle = viz.chartTitle || viz.title || 'Data Visualization';
    let xKey = viz.xKey || viz.x_key;
    let yKeys = viz.yKeys || viz.y_keys || viz.series || [];

    // Normalize common chart types
    if (chartType === 'bar_chart') chartType = 'bar';
    if (chartType === 'line_chart') chartType = 'line';
    if (chartType === 'area_chart') chartType = 'area';
    if (chartType === 'pie_chart') chartType = 'pie';

    if (!xKey) {
        xKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'string' && !['Latitude', 'Longitude', 'lat', 'lng', 'Latitude ', 'Longitude '].includes(k)) || Object.keys(data[0])[0];
    }

    if (!yKeys || yKeys.length === 0) {
        yKeys = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number' && !['Latitude', 'Longitude', 'lat', 'lng', 'Latitude ', 'Longitude '].includes(k));
    }

    if (typeof yKeys === 'string') yKeys = [yKeys];

    const renderDashboardToggle = () => {
        if (isDashboard || !onToggleDashboard) return null;
        return (
            <button
                onClick={onToggleDashboard}
                disabled={isLoading}
                className={`w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[15px] font-medium transition-colors shadow-sm border disabled:opacity-50 ${onDashboard
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-[#8B5CF6] hover:bg-[#773CDD] text-white border-transparent"
                    }`}
            >
                {isLoading ? (
                    <div className="w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    onDashboard ? <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
                )}
                {onDashboard ? "On Dashboard" : "Add to Dashboard"}
            </button>
        );
    };

    // Dynamic Container Classes
    const dynamicChartClass = isDashboard ? "w-full h-full flex-1 min-h-[150px]" : "h-[250px] sm:h-[300px] w-full mt-2";
    const dynamicMapClass = isDashboard ? "w-full h-full flex-1 min-h-[150px]" : "h-[300px] sm:h-[350px] w-full mt-2";
    const dynamicTableClass = isDashboard ? "w-full h-full overflow-auto custom-scrollbar flex-1" : "max-h-[300px] sm:max-h-[400px] overflow-auto custom-scrollbar mt-2";

    // --- KPI LAYOUT ---
    if (['kpi', 'kpi_grid', 'stat_cards'].includes(chartType)) {
        let normalizedKpis: any[] = [];

        if (data.length === 1 || chartType === 'kpi') {
            const obj = data[0];
            let keys = [];

            if (chartType === 'kpi' && yKeys.length > 0) {
                keys = [yKeys[0]];
            } else if (yKeys.length > 0) {
                keys = yKeys;
            } else {
                keys = Object.keys(obj).filter(k => !['id', '_id', 'name', 'title'].includes(k.toLowerCase()) && typeof obj[k] === 'number').slice(0, 4);
                if (keys.length === 0) keys = Object.keys(obj).filter(k => !['id', '_id', 'name', 'title'].includes(k.toLowerCase())).slice(0, 4);
            }

            normalizedKpis = keys.map((key: string, i: number) => {
                const val = Number(obj[key]);
                return {
                    title: key,
                    value: isNaN(val) ? String(obj[key]) : val.toLocaleString(undefined, { maximumFractionDigits: 1 }),
                    trend: obj.trend || obj.change || "",
                    trendLabel: obj.trendLabel || obj.changeLabel || "",
                    variant: ["blue", "pink", "green", "amber"][i % 4] as any,
                    iconType: ["activity", "users", "euro", "building", "card", "cart"][i % 6] as any
                };
            });
        } else {
            normalizedKpis = data.slice(0, 4).map((d, i) => {
                const t = xKey ? d[xKey] : (d.title || d.name || d.metric || Object.keys(d)[0]);
                const rawVal = yKeys && yKeys.length > 0 ? d[yKeys[0]] : (d.value || d.val || Object.values(d)[1] || Object.values(d)[0]);
                const val = Number(rawVal);

                return {
                    title: t,
                    value: isNaN(val) ? rawVal : val.toLocaleString(undefined, { maximumFractionDigits: 1 }),
                    trend: d.trend || d.change || "",
                    trendLabel: d.trendLabel || d.changeLabel || "",
                    variant: (d.variant || ["blue", "pink", "green", "amber"][i % 4]) as any,
                    iconType: (d.iconType || ["activity", "euro", "users", "cart"][i % 4]) as any
                };
            });
        }

        return (
            <Wrapper {...wrapperProps}>
                <div className={isDashboard ? "w-full h-full flex flex-col" : "flex flex-col gap-3 w-full max-w-[800px] mx-auto"}>

                    {/* The KPI Container */}
                    <div className="flex flex-col gap-3 w-full flex-1">
                        {normalizedKpis.map((kpi, idx) => (
                            <div
                                key={`${kpi.title}-${idx}`}
                                /* flex-1 forces it to divide the height evenly, child styling centers it */
                                className={isDashboard ? "flex-1 w-full min-h-[90px] [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div]:justify-center" : "w-full"}
                            >
                                <KpiCard data={kpi} />
                            </div>
                        ))}
                    </div>
                    {renderDashboardToggle()}
                </div>
            </Wrapper>
        );
    }

    // Geospatial
    if (['geo_map', 'geo', 'bubble_map', 'choropleth_map'].includes(chartType)) {
        return (
            <Wrapper {...wrapperProps}>
                <div className={dynamicMapClass}>
                    <GeoMapChart
                        config={{
                            type: chartType as any,
                            data: data.map((d: any) => {
                                const lat = d.Latitude || d['Latitude '] || d.lat || d.Lat;
                                const lng = d.Longitude || d['Longitude '] || d.lng || d.Lng || d.Long;
                                let val = yKeys && yKeys.length > 0 ? Number(d[yKeys[0]]) || 0 : Number(d['Active Cases'] || d['Severity Score'] || d.value || 0);
                                return {
                                    name: d[xKey] || d.City || d.name || d.country || d.Sector || "Unknown",
                                    value: val,
                                    coordinates: (lat && lng) ? [Number(lng), Number(lat)] as [number, number] : undefined
                                };
                            }),
                            colorRange: ["#DDD6FE", "#7C3AED"]
                        }}
                    />
                </div>
                {renderDashboardToggle()}
            </Wrapper>
        );
    }

    // Table
    if (chartType === 'table') {
        return (
            <Wrapper {...wrapperProps}>
                <div className={dynamicTableClass}>
                    <DataTable data={data} />
                </div>
                {renderDashboardToggle()}
            </Wrapper>
        );
    }

    // Heatmap
    if (chartType === 'heatmap') {
        return (
            <Wrapper {...wrapperProps}>
                <div className={dynamicMapClass}>
                    <HeatmapChart data={data} xKey={xKey} yKeys={yKeys} />
                </div>
                {renderDashboardToggle()}
            </Wrapper>
        );
    }

    // All Recharts
    const colors = ["#8B5CF6", "#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#EC4899", "#06B6D4"];
    return (
        <Wrapper {...wrapperProps}>
            <div className={dynamicChartClass}>
                <UniversalChart
                    config={{
                        type: chartType as any,
                        data: data,
                        xAxisKey: xKey,
                        series: yKeys.map((key: string, i: number) => ({
                            dataKey: key,
                            name: key,
                            color: colors[i % colors.length],
                            fill: (chartType.includes('area')) ? colors[i % colors.length] : undefined,
                            dot: (chartType.includes('line') || chartType === 'composed' || chartType === 'scatter' || chartType === 'radar')
                        }))
                    }}
                />
            </div>
            {renderDashboardToggle()}
        </Wrapper>
    );
}