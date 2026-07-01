'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/useAuthStore";
import { Link, useRouter } from "@/i18n/routing";
import { authService } from "@/lib/api/services/auth";

const forgotPasswordSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const { forgotPassword, isLoading: isRequesting } = useAuthStore();
    const router = useRouter();

    const [isOtpMode, setIsOtpMode] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmitEmail = async (data: ForgotPasswordValues) => {
        try {
            await forgotPassword(data.email);
            setEmail(data.email);
            setIsOtpMode(true);
            setCountdown(56);
        } catch (error) {
            console.error("Forgot password request failed", error);
        }
    };

    // Timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    // Handle typing in OTP boxes
    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

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

    const handleResendOtp = async () => {
        try {
            await authService.forgotPassword({ email });
            setCountdown(56);
        } catch (error) {
            console.error("Resend OTP failed", error);
        }
    };

    const isOtpComplete = otp.every((val) => val !== "");

    const handleProceedToReset = () => {
        if (!isOtpComplete) return;
        const otpString = otp.join("");
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpString)}`);
    };

    return (
        <div className="w-full max-w-xs sm:max-w-md lg:max-w-lg z-10 rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-[#D3D3D359]">
            <div className="w-full bg-white rounded-lg border border-border p-4 sm:p-6 lg:p-8">
                <div className="w-full">

                {!isOtpMode ? (
                    <>
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-border flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <KeyRound className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={2} />
                            </div>

                            <h3 style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 600,
                                fontSize: '24px',
                                lineHeight: '32px',
                                color: 'rgb(15, 23, 41)'
                            }} className="mb-2">
                                Forgot password?
                            </h3>
                            <p style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: 'rgb(107, 114, 128)'
                            }} className="px-2">
                                No worries, we&apos;ll send you reset instructions.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmitEmail)} className="flex flex-col gap-6">
                            <FloatingInput
                                id="email"
                                label="Email"
                                type="email"
                                labelBg="white"
                                error={errors.email?.message}
                                {...register("email")}
                            />

                            <Button
                                type="submit"
                                disabled={isRequesting}
                                className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none"
                            >
                                {isRequesting ? "Sending..." : "Reset password"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-border flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={2} />
                            </div>

                            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                                Check your email
                            </h3>

                            <p className="text-sm sm:text-base text-muted-foreground px-2">
                                We sent a password reset code to<br />
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>

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
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-center text-lg sm:text-xl lg:text-2xl font-semibold border-2 border-primary/30 rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                                    />
                                ))}
                            </div>

                            <Button
                                disabled={!isOtpComplete}
                                onClick={handleProceedToReset}
                                className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none disabled:bg-[#773CDD]/50"
                            >
                                Continue
                            </Button>
                        </div>

                        <p className="mt-6 text-sm text-center text-muted-foreground">
                            Didn&apos;t receive the email?{" "}
                            {countdown > 0 ? (
                                <span>Resend in {countdown}s</span>
                            ) : (
                                <button
                                    onClick={handleResendOtp}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Click to resend
                                </button>
                            )}
                        </p>
                    </>
                )}

                <Link
                    href="/auth/signin"
                    className="flex items-center justify-center text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors mt-4"
                >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to log in
                </Link>

                </div>
            </div>
        </div>
    );
}
