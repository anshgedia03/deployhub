"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function AuthSlider() {
    const t = useTranslations("Auth");
    const slides = t.raw("slides");
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <div className="relative hidden lg:flex flex-col w-[48.3%] h-[calc(100vh-32px)] bg-gradient-to-br from-[#543AA7] to-[#5D4BD5] pl-16 text-white rounded-[30px] m-[16px] overflow-hidden">

            <div className="absolute inset-0">
                <div
                    className="absolute -top-32 sm:-top-48 -left-32 sm:-left-48 w-64 sm:w-96 h-64 sm:h-96 rounded-full opacity-30"
                    style={{
                        background: "conic-gradient(from 180deg at 50% 50%, #48367B 0deg, #844CFB 297.33deg, #48367B 360deg)",
                        mask: "radial-gradient(circle, transparent 60px, black 60px, black 120px, transparent 120px)",
                        WebkitMask: "radial-gradient(circle, transparent 60px, black 60px, black 120px, transparent 120px)"
                    }}
                />
                <div
                    className="absolute bottom-4 -right-[240px] sm:-right-[340px] w-[480px] sm:w-[720px] h-[480px] sm:h-[720px] rounded-full opacity-30"
                    style={{
                        background: "conic-gradient(from 150.05deg at 50% 50%, #48367B -30.21deg, #7B73F0 169.62deg, #48367B 329.79deg, #7B73F0 529.62deg)",
                        mask: "radial-gradient(circle, transparent 80px, black 80px, black 160px, transparent 160px)",
                        WebkitMask: "radial-gradient(circle, transparent 80px, black 80px, black 160px, transparent 160px)"
                    }}
                />
            </div>

            <div className="relative mt-auto z-10">
                <div className="flex flex-col justify-center gap-8 sm:gap-16">
                    <div className="relative mb-[207px]">
                        {slides.map((slide: any, index: number) => {
                            const isActive = currentSlide === index;
                            const titleParts = slide.title.split('\n');

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "absolute top-0 left-0 w-full transition-all duration-300 transform",
                                        isActive
                                            ? "opacity-100 translate-y-0 pointer-events-auto"
                                            : "opacity-0 -translate-y-4 pointer-events-none"
                                    )}
                                >
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight text-white">
                                        {titleParts[0]}
                                    </h1>
                                    {titleParts[1] && (
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white/90 leading-tight">
                                            {titleParts[1]}
                                        </h2>
                                    )}
                                    <p className="text-sm sm:text-base text-white/75 mb-6 sm:mb-8 leading-relaxed max-w-xs sm:max-w-sm">
                                        {slide.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 mb-[128px]">
                        {slides.map((_: any, index: number) => (
                            <div
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                                    currentSlide === index ? "bg-white" : "bg-white/30 hover:bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}