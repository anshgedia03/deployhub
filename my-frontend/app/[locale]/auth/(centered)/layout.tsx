import { Mail } from "lucide-react";
import { setRequestLocale } from 'next-intl/server';

export default async function CenteredLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFAFC] overflow-hidden">

            <div
                className="absolute inset-0 opacity-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[50vh] sm:h-[60vh] lg:h-[70vh] aspect-square w-full pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(rgb(229, 231, 235) 1px, transparent 1px), linear-gradient(90deg, rgb(229, 231, 235) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    maskImage: "radial-gradient(circle, black 15%, transparent 65%)",
                    WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 65%)"
                }}
            />

            <div
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                    width: "400px",
                    height: "400px",
                    top: "25%",
                    left: "25%",
                    background: "rgb(187, 158, 255)",
                    filter: "blur(180px)",
                    transform: "rotate(137deg)",
                    opacity: 0.6
                }}
            />

            <div
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                    width: "400px",
                    height: "400px",
                    bottom: "25%",
                    right: "25%",
                    background: "linear-gradient(228deg, rgb(127, 86, 217) 10%, rgb(86, 111, 217) 70%)",
                    filter: "blur(180px)",
                    transform: "rotate(-57deg)",
                    opacity: 0.7
                }}
            />

            <div
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                    width: "500px",
                    height: "500px",
                    bottom: "20%",
                    right: "20%",
                    background: "linear-gradient(228deg, rgb(127, 86, 217) 10%, rgb(86, 111, 217) 70%)",
                    filter: "blur(250px)",
                    transform: "rotate(-57deg)",
                    opacity: 0.2
                }}
            />

            <div className="z-10 w-full max-w-[520px] px-4 sm:px-0">
                {children}
            </div>

            <div className="absolute bottom-8 flex items-center justify-center gap-4 z-10">
                <span style={{ 
                    fontFamily: 'var(--font-inter), Inter, "Inter Fallback", system-ui, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: 'rgb(107, 114, 128)'
                }}>
                    © Trend Agent 2026
                </span>
                <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" style={{ color: 'rgb(107, 114, 128)' }} />
                    <a 
                        href="mailto:help@trendagent.com" 
                        className="transition-colors"
                        style={{ 
                            fontFamily: 'var(--font-inter), Inter, "Inter Fallback", system-ui, sans-serif',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: 'rgb(107, 114, 128)'
                        }}
                    >
                        help@trendagent.com
                    </a>
                </div>
            </div>
        </div>
    );
}