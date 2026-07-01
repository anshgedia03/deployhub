"use client";

import { Button } from "@/components/ui/button";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useEffect, useRef, Suspense } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { BACKDEND_BASE_URL } from "@/constants/api";

interface AuthContainerProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export function AuthContainer(props: AuthContainerProps) {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#EDEDED]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        }>
            <AuthContainerContent {...props} />
        </Suspense>
    );
}

function AuthContainerContent({ title, description, children }: AuthContainerProps) {
    const t = useTranslations("Auth");
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { fetchProfile, isAuthenticated } = useAuthStore();
    const hasCheckedProfile = useRef(false);

    // 1. Handle incoming messages (for popups if still used elsewhere)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== `${BACKDEND_BASE_URL}`) return;
            const data = event.data;
            if (data && data.status === "verification_required") {
                showToast(data.message || "OTP sent successfully", "success");
                router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
            }
            // if(data && data.message === "Please verify email"){
            //     showToast(data.message, "error");
            //     router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
            // } 
            else if (data && data.status === "signed_in") {
                showToast(data.message || "Signed in successfully", "success");
                fetchProfile().then(() => router.push("/home"));
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [router, showToast, fetchProfile]);

    // 2. Handle messages from URL params (for redirects)
    useEffect(() => {
        const msg = searchParams.get("message");
        const status = searchParams.get("status");
        if (msg) {
            showToast(msg, status === "error" ? "error" : "success");
        }
    }, [searchParams, showToast]);

    // 3. Initial profile fetch
    useEffect(() => {
        if (!hasCheckedProfile.current) {
            hasCheckedProfile.current = true;
            fetchProfile();
        }
    }, [fetchProfile]);

    // 4. Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            if (pathname.includes("/signin") || pathname.includes("/signup")) {
                router.push("/home");
            }
        }
    }, [isAuthenticated, pathname, router]);

    if (isAuthenticated && (pathname.includes("/signin") || pathname.includes("/signup"))) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#EDEDED]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const handleGoogleLogin = () => {
        // As per API Contract: requires a full browser redirect.
        // We use the proxy to ensure cookies are handled correctly.
        window.location.href = "/api/auth/google";
    };

    return (
        <div className="flex-1 flex flex-col justify-center items-center relative h-full w-full">
            <div className="w-full max-w-[384px] z-10">

                <div className="text-center mb-6 sm:mb-8">
                    <Link href="/home" className="flex gap-2 justify-center items-center font-bold text-slate-900 mb-6 sm:mb-8">
                        <Image
                            src="/trend-agent-logo.svg"
                            alt="Trend Agent Logo"
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                        />
                        <h2 className="font-bold text-slate-900 text-sm sm:text-base">Trend Agent</h2>

                    </Link>
                    <h2 className="text-[rgb(15,23,41)] text-[24px] leading-[32px] font-semibold mb-2">{title}</h2>
                    <p className="text-[14px] leading-[20px] font-normal text-[rgb(107,114,128)] px-2">{description}</p>
                </div>

                <div className="flex flex-col justify-center items-center w-full">

                    <div data-tour="/sign-in-switch" className="inline-flex border border-border space-x-1 bg-[#F2F2F2] rounded-md p-1 w-auto mb-[20px]">
                        <Link href="/auth/signin">
                            <span className={cn(
                                "inline-block px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-md cursor-pointer",
                                pathname === "/auth/signin" || pathname.includes("/signin") 
                                    ? "bg-white text-[#333333] shadow-sm border border-[#EDEDED]" 
                                    : "text-[#333333]/50 hover:text-[#333333] border border-transparent"
                            )}>
                                {t("login")}
                            </span>
                        </Link>
                        <Link href="/auth/signup">
                            <span className={cn(
                                "inline-block px-4 sm:px-8 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-md cursor-pointer",
                                pathname === "/auth/signup" || pathname.includes("/signup") 
                                    ? "bg-white text-[#333333] shadow-sm border border-[#EDEDED]" 
                                    : "text-[#333333]/50 hover:text-[#333333] border border-transparent"
                            )}>
                                {t("signup")}
                            </span>
                        </Link>
                    </div>

                    {children}

                    <Button
                        variant="outline"
                        className="w-full h-auto min-h-[42px] bg-transparent border border-gray-300 flex items-center justify-center text-[14px] leading-[25px] font-semibold text-[rgb(15,23,41)] mt-[20px] rounded-lg px-4 py-1.5 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-gray-50 shadow-none"
                        onClick={handleGoogleLogin}
                    >
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" className="mr-2 w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        {t("loginWithGoogle")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
