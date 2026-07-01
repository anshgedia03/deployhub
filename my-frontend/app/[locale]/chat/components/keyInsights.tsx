"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Data structure based on your screenshot
const INSIGHTS_DATA = [
    {
        id: "macro",
        icon: "📉",
        title: "Macro-Economic Outlook",
        summary: "Inflation pressure is easing across major European economies, improving financing conditions.",
        details: [
            "Interest rate cuts are expected to restart transaction activity in 2025.",
            "Household consumption is projected to be the primary growth driver.",
            "Capital markets remain cautious but optimistic."
        ]
    },
    {
        id: "sector",
        icon: "🏢",
        title: "Sector Performance",
        summary: "Logistics and living assets continue to outperform traditional office segments.",
        details: [
            "Industrial yields remain attractive compared to historical averages.",
            "Retail parks show resilience driven by discount retailers."
        ]
    },
    {
        id: "risks",
        icon: "⚠️",
        title: "Key Risks",
        summary: "Geopolitical and regulatory risks remain the main downside factors.",
        details: [
            "Strict ESG regulations may strand non-compliant assets.",
            "Supply chain disruptions continue to affect construction costs."
        ]
    }
];

export function KeyInsightsMessage() {
    // Default to having the first item open
    const [expandedId, setExpandedId] = useState<string | null>("macro");

    const toggleItem = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="flex flex-col w-full">

            {/* Header */}
            <h3 className="text-[17px] font-bold text-slate-900 mb-4 tracking-tight">
                Key Insights from Uploaded Market Reports
            </h3>

            {/* Accordion List */}
            <div className="flex flex-col gap-3">
                {INSIGHTS_DATA.map((item) => {
                    const isExpanded = expandedId === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`border transition-all duration-200 rounded-xl p-4 sm:p-5 ${isExpanded
                                ? "border-[#C4B5FD] bg-white shadow-sm" // Slightly tinted border when active
                                : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                        >
                            {/* Always-visible Header and Summary */}
                            <div
                                onClick={() => toggleItem(item.id)}
                                className="flex justify-between items-start group"
                            >
                                <div className="flex flex-col gap-1.5 pr-4">
                                    <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                                        <span>{item.icon}</span>
                                        {item.title}
                                    </div>
                                    <p className="text-[14.5px] text-slate-600 leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>

                                <div className="mt-0.5 text-slate-900 shrink-0">
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 transition-transform group-hover:text-slate-600" />
                                    )}
                                </div>
                            </div>

                            {/* Expandable Details (Bulleted List) */}
                            {isExpanded && item.details.length > 0 && (
                                <div className="mt-4 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <ul className="list-disc pl-5 space-y-2.5 text-[14.5px] text-slate-600 marker:text-slate-400">
                                        {item.details.map((detail, idx) => (
                                            <li key={idx} className="leading-relaxed pl-1">
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}