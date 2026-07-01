'use client'
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import { ToastProvider } from "@/contexts/ToastContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <QueryProvider>
                {children}
            </QueryProvider>
        </ToastProvider>
    )
}