import { SignupForm } from "@/app/[locale]/auth/components/authForms";
import { Suspense } from "react";

export default function SignUpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}