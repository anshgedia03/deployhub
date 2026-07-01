"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    // Now expects a direct color value like "#FAFAFC", "white", or "rgb(250, 250, 252)"
    labelBg?: string;
    containerClassName?: string;
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, error, labelBg = "white", type = "text", containerClassName, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === "password";
        const inputType = isPassword ? (showPassword ? "text" : "password") : type;

        return (
            <div className={cn("w-full relative", containerClassName)}>
                <div className="relative">
                    <input
                        id={id}
                        type={inputType}
                        ref={ref}
                        className={cn(
                            "block px-3 pb-2.5 pt-4 w-full h-[54px] text-[16px] leading-[23px] font-normal text-[rgb(15,23,41)] bg-transparent rounded-lg border appearance-none focus:outline-none focus:ring-1 peer transition-all duration-200 ease-in-out",
                            error ? "border-[#d32f2f] focus:border-[#d32f2f] focus:ring-[#d32f2f]" : "border-gray-300 focus:border-[#773CDD] focus:ring-[#773CDD]",
                            isPassword ? "pr-10" : ""
                        )}
                        placeholder=" "
                        {...props}
                    />
                    <label
                        htmlFor={id}
                        // Applies the dynamic color directly, bypassing Tailwind's compiler
                        style={{ backgroundColor: labelBg }}
                        className={cn(
                            "absolute text-[16px] leading-[23px] font-normal transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-2 pointer-events-none transition-all duration-200 ease-in-out",
                            error ? "text-[#d32f2f] peer-focus:text-[#d32f2f]" : "text-[rgb(107,114,128)] peer-placeholder-shown:text-[rgb(107,114,128)] peer-focus:text-[#773CDD]"
                        )}
                    >
                        {label}
                    </label>
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        >
                            {showPassword ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                        </button>
                    )}
                </div>
                {error && <p className="absolute top-full left-1 mt-1 text-[12px] text-[#d32f2f]">{error}</p>}
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";