import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/[locale]/auth/components/resetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}