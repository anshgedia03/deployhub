import { LoginForm } from "@/app/[locale]/auth/components/authForms";
import { Suspense } from "react";

export default function SignInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}