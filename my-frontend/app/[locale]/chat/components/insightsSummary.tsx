"use client";

export function InsightSummaryMessage() {
    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            <h3 className="text-[16.5px] font-bold text-slate-900 mb-3 flex items-center gap-2 tracking-tight">
                📊 AI Insight Summary — European Real Estate Outlook 2025
            </h3>

            {/* Intro Paragraph */}
            <p className="text-[14.5px] text-slate-700 leading-relaxed mb-4">
                Based on the uploaded market outlook documents, European real estate is entering a <span className="font-bold text-slate-900">gradual recovery phase</span> driven by falling inflation, improving consumer confidence, and easing interest rates.
            </p>

            {/* Bulleted List */}
            <ul className="list-disc pl-5 space-y-3 mb-6 text-[14.5px] text-slate-700 leading-relaxed marker:text-slate-400">
                <li>
                    <span className="font-bold text-slate-900">Economic Growth:</span> GDP growth across Europe is expected to rebound in 2025, supported mainly by household consumption.
                </li>
                <li>
                    <span className="font-bold text-slate-900">Investment Activity:</span> Real estate transaction volumes are likely to increase as pricing stabilises and buyer-seller expectations align.
                </li>
                <li>
                    <span className="font-bold text-slate-900">Sector Momentum:</span> Logistics, living assets, and data centres show the strongest demand outlook due to structural supply constraints.
                </li>
                <li>
                    <span className="font-bold text-slate-900">Sustainability:</span> ESG compliance and reporting requirements will increasingly influence asset pricing and investor decisions.
                </li>
            </ul>

            {/* AI Note Callout Box */}
            <div className="bg-[#F3E8FF] rounded-xl p-4 sm:p-5 flex gap-2.5 border border-[#E9D5FF]/50 shadow-sm">
                <span className="text-[15px] shrink-0 mt-0.5">💡</span>
                <p className="text-[14.5px] text-[#773CDD] leading-relaxed">
                    <span className="font-bold">AI Note:</span> Assets aligned with sustainability standards and located in prime urban markets are expected to outperform over the next 2–3 years.
                </p>
            </div>
        </div>
    );
}