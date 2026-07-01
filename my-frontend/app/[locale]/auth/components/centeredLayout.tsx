import { Mail } from "lucide-react";

export function CenteredLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden">

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#773CDD] opacity-[0.08] blur-[100px] rounded-full pointer-events-none" />

            <div className="z-10 w-full max-w-[420px] px-4 sm:px-0">
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