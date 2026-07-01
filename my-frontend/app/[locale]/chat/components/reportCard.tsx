"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Data structure matching your exact content and colors
const REPORT_ITEMS = [
    {
        id: "ai",
        title: "Artificial Intelligence (AI)",
        confidence: "High",
        dotColor: "bg-[#8B5CF6]", // Purple
        description: "Expected to grow significantly across all real estate sectors over the next five years.",
        impact: "Moving beyond utilization planning (residential/hospitality) to administrative tasks (e.g., automated rent collection, tracking energy/water usage).",
        subTrends: ["Optimisation", "Predictive Analytics", "Process Automation"]
    },
    {
        id: "esg",
        title: "Sustainability (ESG)",
        confidence: "Medium-High",
        dotColor: "bg-[#22C55E]", // Green
        description: "Increasing regulatory pressure and tenant demand for green buildings.",
        impact: "Requires significant CapEx for retrofitting older buildings to meet new efficiency standards.",
        subTrends: ["Green Building", "Carbon Neutrality", "Energy Efficiency"]
    },
    {
        id: "cre",
        title: "Commercial Real Estate",
        confidence: "Medium",
        dotColor: "bg-[#3B82F6]", // Blue
        description: "The office sector is bifurcating into prime (high demand) and secondary (risk of obsolescence).",
        impact: "Tenants demand flexibility, wellness features, and prime locations to attract talent back to the office.",
        subTrends: ["Hybrid Work", "Flight to Quality", "Flexible Leases"]
    }
];

export function ReportCard() {
    // Single state controls both the highlighted tags AND the open accordions
    const [expandedIds, setExpandedIds] = useState<string[]>(["ai"]);

    // Toggles an item open or closed
    const toggleItem = (id: string) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm w-full">

            {/* Header */}
            <h2 className="text-lg sm:text-[18px] font-bold text-slate-900 mb-1">
                Timelines of Final Report from 2022 to 2025
            </h2>
            <p className="text-[14px] text-gray-500 mb-5">
                Tell me what's on your mind, or pick your suggestion
            </p>

            {/* Interactive Tags / Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {REPORT_ITEMS.map((item) => {
                    const isActive = expandedIds.includes(item.id);
                    return (
                        <button
                            key={`tag-${item.id}`}
                            onClick={() => toggleItem(item.id)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-200 ${isActive
                                ? "bg-[#8B5CF6] text-white shadow-sm"
                                : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                                }`}
                        >
                            {item.title}
                        </button>
                    );
                })}
            </div>

            {/* Accordion List */}
            <div className="flex flex-col gap-3">
                {REPORT_ITEMS.map((item) => {
                    const isExpanded = expandedIds.includes(item.id);

                    return (
                        <div
                            key={item.id}
                            className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded
                                ? "border-[#E9D5FF] bg-[#F8F6FF]" // Expanded Purple State
                                : "border-gray-100 bg-white hover:border-gray-200" // Collapsed State
                                }`}
                        >
                            {/* Accordion Trigger */}
                            <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor} shrink-0`}></span>
                                        <p className="text-[14px] font-bold text-slate-900 leading-none">
                                            {item.title}
                                        </p>
                                    </div>
                                    <p className="text-[12px] text-gray-500 pl-5 mt-1">
                                        Confidence: {item.confidence}
                                    </p>
                                </div>

                                <div className="shrink-0 ml-4">
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-[#8B5CF6]" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Accordion Content */}
                            {isExpanded && (
                                <div className="px-4 pb-5 pt-2 pl-9 animate-in fade-in slide-in-from-top-2 duration-300">

                                    <div className="mb-4">
                                        <h4 className="text-[11px] font-bold text-[#8B5CF6] tracking-wider uppercase mb-1.5">
                                            Description
                                        </h4>
                                        <p className="text-[13px] text-slate-700 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="mb-5">
                                        <h4 className="text-[11px] font-bold text-[#8B5CF6] tracking-wider uppercase mb-1.5">
                                            Impact & Key Considerations
                                        </h4>
                                        <p className="text-[13px] text-slate-700 leading-relaxed">
                                            {item.impact}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-[11px] font-bold text-[#8B5CF6] tracking-wider uppercase mb-2.5">
                                            AI-Identified Trends
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {item.subTrends.map((trend, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-white border border-[#D8B4FE] text-[#8B5CF6] rounded-full text-[12px] font-semibold shadow-sm"
                                                >
                                                    {trend}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Timeline Legend */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#8B5CF6]"></span>
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">2022 - 2023</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-500"></span>
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">2023 - 2024</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-400"></span>
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">2024 - 2025</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-300"></span>
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">2025 - 2027</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-200"></span>
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">2027 - 2030</span>
                </div>
            </div>

        </div>
    );
}