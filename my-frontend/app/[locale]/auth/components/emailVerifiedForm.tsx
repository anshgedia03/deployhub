"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { CenteredLayout } from "@/app/[locale]/auth/components/centeredLayout";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function EmailVerifiedForm() {
    const t = useTranslations("Auth");
    return (
        <CenteredLayout>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 flex flex-col items-center text-center">

                {/* Success Icon */}
                <div className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-[#773CDD]" />
                </div>

                {/* Text */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{t("emailVerified")}</h2>
                <p className="text-[14px] text-gray-500 mb-8 max-w-[280px]">
                    {t("verifySuccess")}
                </p>

                {/* Button */}
                <Link href="/auth/signin" className="w-full">
                    <Button className="w-full h-[48px] bg-[#773CDD] hover:bg-[#602eb8] text-[14px] font-medium text-white rounded-lg transition-colors shadow-none">
                        {t("continue")}
                    </Button>
                </Link>
            </div>
        </CenteredLayout>
    );
}