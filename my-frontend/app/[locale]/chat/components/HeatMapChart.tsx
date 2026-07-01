"use client";

import { scaleLinear } from "d3-scale";

interface HeatmapProps {
    data: Record<string, any>[];
    xKey?: string;
    yKeys?: string[];
    colorRange?: [string, string];
}

export default function HeatmapChart({ data, xKey, yKeys, colorRange = ["#f8fafc", "#8b5cf6"] }: HeatmapProps) {
    if (!data || data.length === 0) return null;

    // Fallback key extraction in case they are missing
    const actualXKey = xKey || Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || Object.keys(data[0])[0];
    const actualYKeys = (yKeys && yKeys.length > 0)
        ? yKeys
        : Object.keys(data[0]).filter(k => k !== actualXKey && typeof data[0][k] === 'number');

    const allValues = data.flatMap(d => actualYKeys.map(k => Number(d[k]) || 0));
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 1);

    const colorScale = scaleLinear<string>().domain([min, max]).range(colorRange);

    return (
        <div className="w-full h-full overflow-auto relative rounded-md border border-slate-100 custom-scrollbar">
            <table className="w-full min-w-max border-collapse text-sm">
                <thead>
                    <tr>
                        {/* Top Left Empty Cell */}
                        <th className="sticky top-0 left-0 z-20 bg-white border-b border-r border-slate-200 p-2 shadow-sm"></th>

                        {/* Top X-Axis Headers */}
                        {data.map((d, i) => (
                            <th key={i} className="sticky top-0 z-10 bg-white border-b border-slate-200 p-2 font-semibold text-slate-600 text-center text-[11px] whitespace-nowrap shadow-sm min-w-[70px]">
                                {d[actualXKey]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Y-Axis Rows */}
                    {actualYKeys.map((yKey) => (
                        <tr key={yKey}>
                            {/* Left Y-Axis Sticky Header */}
                            <td className="sticky left-0 z-10 bg-white border-r border-slate-200 p-3 font-semibold text-slate-700 text-[12px] whitespace-nowrap shadow-sm">
                                {yKey}
                            </td>

                            {/* Heatmap Data Cells */}
                            {data.map((d, i) => {
                                const val = Number(d[yKey]) || 0;
                                return (
                                    <td key={i} className="p-1 border-b border-slate-50">
                                        <div
                                            className="w-full h-12 rounded-md flex items-center justify-center relative group transition-all hover:ring-2 hover:ring-slate-300 hover:z-10 shadow-sm"
                                            style={{ backgroundColor: colorScale(val) }}
                                            title={`${d[actualXKey]} - ${yKey}: ${val}`}
                                        >
                                            <span className="text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-1.5 py-0.5 rounded text-slate-900 shadow-sm pointer-events-none">
                                                {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                            </span>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}