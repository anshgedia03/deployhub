"use client";

import  { useState } from "react";

// Dummy data for the different tab states
const TABS_DATA: Record<string, string> = {
    "Market": "European markets are transitioning from correction to stabilisation, with pricing discovery largely complete.",
    "Occupiers": "Occupier demand remains resilient for prime ESG-compliant spaces, while secondary assets face significant headwinds.",
    "Investors": "Investors are prioritizing core-plus strategies with a strong focus on energy efficiency and sustainable long-term yields."
};

export function ChatTabsMessage() {
    // State to track which tab is currently selected
    const [activeTab, setActiveTab] = useState<string>("Market");

    return (
        <div className="flex gap-4 w-full max-w-[800px] mx-auto py-4">

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">

                {/* Tabs Row */}
                <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(TABS_DATA).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 ${isActive
                                    ? "bg-[#8B5CF6] text-white shadow-sm" // Active Purple
                                    : "bg-[#F3F4F6] text-slate-600 hover:bg-[#E5E7EB]" // Inactive Gray
                                    }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {/* Content Box */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 text-[14.5px] text-slate-800 leading-relaxed shadow-sm w-full">
                    {TABS_DATA[activeTab]}
                </div>

            </div>

        </div>
    );
}