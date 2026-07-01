"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/lib/api/services/auth";
import { useTranslations } from "next-intl";

export function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const t = useTranslations("Auth");

    const { verifyEmail, isLoading } = useAuthStore();
    const router = useRouter();

    // View toggle states
    const [isManualMode, setIsManualMode] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Timer state
    const [countdown, setCountdown] = useState(56);
    const [redirectCountdown, setRedirectCountdown] = useState(5);

    // OTP State and Refs
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Timer logic for OTP resend
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0 && !isVerified) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown, isVerified]);

    // Timer logic for automatic redirect after verification
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVerified && redirectCountdown > 0) {
            timer = setInterval(() => {
                setRedirectCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isVerified && redirectCountdown === 0) {
            router.push("/home");
        }
        return () => clearInterval(timer);
    }, [isVerified, redirectCountdown, router]);

    // Handle typing in OTP boxes
    const handleChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace to move to previous box
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle pasting a 6-digit code
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, "");
        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const isOtpComplete = otp.every((val) => val !== "");

    const handleVerify = async () => {
        if (!isOtpComplete) return;
        const otpString = otp.join("");
        try {
            await verifyEmail({ email, otp: otpString });
            setIsVerified(true);
        } catch (error) {
            console.error("Verification failed", error);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authService.resendOtp(email);
            setCountdown(56);
        } catch (error) {
            console.error("Resend OTP failed", error);
        }
    };

    return (
        <div className="w-full max-w-xs sm:max-w-md lg:max-w-lg z-10 rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-[#D3D3D359]">
            <div className="w-full bg-white rounded-lg border border-border p-4 sm:p-6 lg:p-8">
                <div className="w-full">

                {!isVerified ? (
                    /* =========================================
                       VIEW 1 & 2: VERIFICATION PROCESS
                       ========================================= */
                    <>
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-border flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={2} />
                            </div>

                            <h3 style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 600,
                                fontSize: '24px',
                                lineHeight: '32px',
                                color: 'rgb(15, 23, 41)'
                            }} className="mb-2">
                                {t("checkEmail")}
                            </h3>
                            <p style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: 'rgb(107, 114, 128)'
                            }} className="px-2 text-sm sm:text-base text-muted-foreground">
                                {t("verificationSent")}<br />
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>

                        {!isManualMode ? (
                            <Button
                                onClick={() => setIsManualMode(true)}
                                className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none"
                            >
                                {t("enterCodeManually")}
                            </Button>
                        ) : (
                            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex gap-2 sm:gap-3 mb-6">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-center text-lg sm:text-xl lg:text-2xl font-semibold border-2 border-primary/30 rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                                        />
                                    ))}
                                </div>

                                <Button
                                    disabled={!isOtpComplete || isLoading}
                                    onClick={handleVerify}
                                    className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none disabled:bg-[#773CDD]/50"
                                >
                                    {isLoading ? t("verifying") : t("verifyEmail")}
                                </Button>
                            </div>
                        )}

                        <p className="mt-6 text-sm text-center text-muted-foreground">
                            {t("didntReceiveEmail")}{" "}
                            {countdown > 0 ? (
                                <span>{t("resendIn", { seconds: countdown })}</span>
                            ) : (
                                <button
                                    onClick={handleResendOtp}
                                    className="text-primary hover:underline font-medium"
                                >
                                    {t("clickToResend")}
                                </button>
                            )}
                        </p>

                        <Link
                            href="/auth/signup"
                            className="flex items-center justify-center text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors mt-4"
                        >
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            {t("backToSignup")}
                        </Link>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center w-full">
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-border flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={2} />
                            </div>

                            <h3 style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 600,
                                fontSize: '24px',
                                lineHeight: '32px',
                                color: 'rgb(15, 23, 41)'
                            }} className="mb-2">
                                {t("emailVerified")}
                            </h3>
                            <p style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: 'rgb(107, 114, 128)'
                            }} className="px-2 text-sm sm:text-base text-muted-foreground">
                                {t("verifySuccess")}
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <Link href="/home" className="w-full">
                                <Button className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none">
                                    {t("continue")}
                                </Button>
                            </Link>
                            
                            <p className="text-[13px] text-center text-muted-foreground">
                                Redirecting to home in {redirectCountdown} seconds...
                            </p>
                        </div>
                    </div>
                )}

                </div>
            </div>
        </div>
    );
}