import { VerifyEmailForm } from "@/app/[locale]/auth/components/verifyEmailForm";
import { Suspense } from "react";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-[540px] h-[400px] bg-white/50 animate-pulse rounded-[32px]" />
        }>
            <VerifyEmailForm />
        </Suspense>
    );
}