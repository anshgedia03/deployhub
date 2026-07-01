"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "@/i18n/routing";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isInitialLoading, fetchProfile } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        // Only fetch if we haven't checked yet
        if (isInitialLoading) {
            fetchProfile();
        }
    }, [fetchProfile, isInitialLoading]);

    useEffect(() => {
        // If loading is done and user is not authenticated, redirect to signin
        if (hasMounted && !isInitialLoading && !isAuthenticated) {
            const returnUrl = encodeURIComponent(pathname);
            router.push(`/auth/signin?returnUrl=${returnUrl}`);
        }
    }, [hasMounted, isInitialLoading, isAuthenticated, router, pathname]);

    // Show loading spinner while checking auth status OR before mounting to avoid hydration mismatch
    if (!hasMounted || isInitialLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return <>{children}</>;
}
