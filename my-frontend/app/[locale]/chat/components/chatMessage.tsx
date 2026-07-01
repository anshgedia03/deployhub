"use client";

import React from "react";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
    role: "user" | "ai";
    children: React.ReactNode;
}

export function ChatMessage({ role, children }: ChatMessageProps) {
    const isAI = role === "ai";

    return (
        <div className="flex gap-2 sm:gap-4 w-full max-w-[800px] mx-auto py-3">

            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                {isAI ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                    </div>
                ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-tr from-[#8B5CF6] to-[#773CDD] rounded-full flex items-center justify-center shadow-sm">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                {typeof children === "string" ? (
                    // Simple text message styling
                    <div className={`text-[14px] sm:text-[15px] leading-relaxed pt-1.5 ${isAI ? "text-slate-700" : "text-slate-900 font-medium"}`}>
                        {children}
                    </div>
                ) : (
                    // Complex component styling (like the ReportCard)
                    <div className="mt-1">
                        {children}
                    </div>
                )}
            </div>

        </div>
    );
}