import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "../layout/sidebar/app-sidebar"
import { Header } from "../layout/header/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Suspense } from "react"
import { setRequestLocale } from 'next-intl/server';


export default async function DashboardLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <ProtectedRoute>
            <SidebarProvider
                style={{
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--sidebar-height": "calc(var(--spacing) * 12)"
                } as React.CSSProperties}
            >
                <TooltipProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <Suspense>
                            <Header />
                        </Suspense>
                        <main>
                            {children}
                        </main>
                    </SidebarInset>
                </TooltipProvider>
            </SidebarProvider>
        </ProtectedRoute>
    )
}