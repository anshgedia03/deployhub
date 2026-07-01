import { AuthSlider } from "@/app/[locale]/auth/components/authSlider";
import { setRequestLocale } from 'next-intl/server';
import { LanguageSelector } from "./LanguageSelector";

export default async function AuthLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="flex h-screen w-full font-sans text-slate-900 bg-[#EDEDED] overflow-hidden">

            <AuthSlider />

            <div className="flex flex-col flex-1 relative bg-[#EDEDED] h-full">

                <LanguageSelector />

                <div className="flex-1 flex flex-col justify-center items-center w-full h-full overflow-y-auto pt-16 pb-20">
                    {children}
                </div>

                <div className="absolute bottom-4 sm:bottom-8 left-3 sm:left-4 flex pointer-events-none">
                    <p style={{
                        fontFamily: 'var(--font-inter), Inter, "Inter Fallback", system-ui, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: 'rgb(107, 114, 128)'
                    }}>
                        © Trend Agent 2026
                    </p>
                </div>

            </div>
        </div>
    );
}
