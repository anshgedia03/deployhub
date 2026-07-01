"use client";

import { Globe } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";

export function LanguageSelector() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();

    const switchLanguage = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale as any });
    };

    return (
        <div className="absolute top-5 right-5 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-sm border border-border hover:bg-background-selected py-2 px-3 outline-none transition-colors text-[16px] leading-[24px] font-normal text-[rgba(0,0,0,0.87)] cursor-pointer hover:text-black focus:text-black">
                    <Globe className="h-6 w-6" />
                    <span className="ml-3 transition-opacity duration-300">{locale === "en" ? "English" : "Deutsch"}</span>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className=" bg-white rounded-sm p-0 outline-none transition-all duration-200"
                    style={{
                        boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)"
                    }}
                >
                    <ul className="py-2 list-none m-0">
                        <DropdownMenuItem
                            onClick={() => switchLanguage("en")}
                            className="text-[16px] leading-[24px] font-normal text-[rgba(0,0,0,0.87)] data-highlighted:text-black! focus:text-black! flex items-center gap-2 py-1.5 px-4 focus:bg-[rgb(246,246,246)] outline-none cursor-pointer transition-colors rounded-none hover:text-black!"
                        >
                            <span>🇬🇧</span>
                            <span>English</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => switchLanguage("de")}
                            className="text-[16px] leading-[24px] font-normal text-[rgba(0,0,0,0.87)] data-[highlighted]:text-black focus:text-black flex items-center gap-2 py-1.5 px-4 data-[highlighted]:bg-[rgb(246,246,246)] focus:bg-[rgb(246,246,246)] outline-none cursor-pointer transition-colors rounded-none"
                        >
                            <span>🇩🇪</span>
                            <span>Deutsch</span>
                        </DropdownMenuItem>
                    </ul>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
