'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LockKeyhole, ArrowLeft, CheckCircle2 } from "lucide-react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/useAuthStore";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

export function ResetPasswordForm() {
    const { resetPassword, isLoading } = useAuthStore();
    const searchParams = useSearchParams();
    const t = useTranslations("Auth");

    const email = searchParams.get("email") || "";
    const otp = searchParams.get("otp") || "";

    // State to handle the view swap
    const [isSuccess, setIsSuccess] = useState(false);

    const resetPasswordSchema = z.object({
        password: z.string()
            .min(6, t("resetPassword.validation.passwordMinLength"))
            .regex(/[!@#$%^&*(),.?":{}|<>]/, t("resetPassword.validation.passwordSpecialChar")),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: t("resetPassword.validation.passwordsDoNotMatch"),
        path: ["confirmPassword"],
    });

    const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: any) => {
        try {
            await resetPassword({
                email,
                otp,
                newPassword: data.password
            });
            setIsSuccess(true);
        } catch (error) {
            console.error("Password reset failed", error);
        }
    };

    const passwordValue = watch("password", "");
    const hasMinLength = passwordValue.length >= 6;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

    return (
        <div className="w-full max-w-xs sm:max-w-md lg:max-w-lg z-10 rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-[#D3D3D359]">
            <div className="w-full bg-white rounded-lg border border-border p-4 sm:p-6 lg:p-8">
                <div className="w-full">

                {!isSuccess ? (
                    <>
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border border-border flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <LockKeyhole className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={2} />
                            </div>

                            <h3 style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 600,
                                fontSize: '24px',
                                lineHeight: '32px',
                                color: 'rgb(15, 23, 41)'
                            }} className="mb-2">
                                {t("resetPassword.title")}
                            </h3>
                            <p style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: 'rgb(107, 114, 128)'
                            }} className="px-2 text-sm sm:text-base text-muted-foreground">
                                {t("resetPassword.description")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

                            <div className="space-y-4 sm:space-y-5">
                                <FloatingInput
                                    id="password"
                                    label={t("passwordLabel")}
                                    type="password"
                                    labelBg="white"
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                <FloatingInput
                                    id="confirmPassword"
                                    label={t("resetPassword.confirmPasswordLabel")}
                                    type="password"
                                    labelBg="white"
                                    error={errors.confirmPassword?.message}
                                    {...register("confirmPassword")}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className={`flex items-center gap-2 text-xs sm:text-sm ${hasMinLength ? "text-success" : "text-muted-foreground"}`}>
                                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${hasMinLength ? "bg-success border-success" : "border-muted-foreground"}`}>
                                        {hasMinLength && <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={4} />}
                                    </div>
                                    Must be at least <span className="font-medium">6</span> characters
                                </div>
                                <div className={`flex items-center gap-2 text-xs sm:text-sm ${hasSpecialChar ? "text-success" : "text-muted-foreground"}`}>
                                    <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${hasSpecialChar ? "bg-success border-success" : "border-muted-foreground"}`}>
                                        {hasSpecialChar && <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={4} />}
                                    </div>
                                    Must contain one special character
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none !mt-0"
                            >
                                {isLoading ? t("resetPassword.resetting") : t("resetPassword.submitButton")}
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
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
                                {t("resetPassword.successTitle")}
                            </h3>
                            <p style={{
                                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: 'rgb(107, 114, 128)'
                            }} className="px-2 text-sm sm:text-base text-muted-foreground">
                                {t("resetPassword.successDescription")}
                            </p>
                        </div>

                        <Link href="/auth/signin" className="w-full">
                            <Button className="w-full h-10 text-[14px] font-medium leading-[25px] text-white bg-[#773CDD] hover:bg-[#773CDD]/90 shadow-none">
                                {t("continue")}
                            </Button>
                        </Link>
                    </>
                )}

                <Link
                    href="/auth/signin"
                    className="flex items-center gap-2 justify-center text-sm sm:text-base font-semibold transition-colors hover:text-primary mt-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("resetPassword.backToLogin")}
                </Link>

                </div>
            </div>
        </div>
    );
}
