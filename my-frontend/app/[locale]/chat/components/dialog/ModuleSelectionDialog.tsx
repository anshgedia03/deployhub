"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProjectStore } from "@/store/useProjectStore";
import { cn } from "@/lib/utils";

interface ModuleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectModule: (moduleName: string) => void;
}

export function ModuleSelectionModal({
    isOpen,
    onClose,
    onSelectModule
}: ModuleSelectionModalProps) {
    const t = useTranslations("Chat");
    const isActionLoading = useProjectStore((state) => state.isActionLoading);

    if (!isOpen) return null;

    const modules = [
        {
            id: "timelines",
            title: t("timelines"),
            description: t("timelinesDesc"),
            icon: (
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-primary size-5 md:size-6">
                    <path d="M46.6355 40.8062H45.8027V8.32656C45.8027 7.66394 45.5395 7.02845 45.071 6.5599C44.6024 6.09135 43.9669 5.82812 43.3043 5.82812H31.6449C30.9823 5.82812 30.3468 6.09135 29.8783 6.5599C29.4097 7.02845 29.1465 7.66394 29.1465 8.32656V15.8219H19.9855C19.3229 15.8219 18.6874 16.0851 18.2189 16.5536C17.7503 17.0222 17.4871 17.6577 17.4871 18.3203V25.8156H9.9918C9.32917 25.8156 8.69368 26.0789 8.22513 26.5474C7.75659 27.0159 7.49336 27.6514 7.49336 28.3141V40.8062H6.66055C5.99792 40.8062 5.36243 41.0695 4.89388 41.538C4.42534 42.0066 4.16211 42.6421 4.16211 43.3047C4.16211 43.9673 4.42534 44.6028 4.89388 45.0713C5.36243 45.5399 5.99792 45.8031 6.66055 45.8031H46.6355C47.2982 45.8031 47.9337 45.5399 48.4022 45.0713C48.8708 44.6028 49.134 43.9673 49.134 43.3047C49.134 42.6421 48.8708 42.0066 48.4022 41.538C47.9337 41.0695 47.2982 40.8062 46.6355 40.8062ZM34.1434 10.825H40.8059V40.8062H34.1434V10.825ZM22.484 20.8187H29.1465V40.8062H22.484V20.8187ZM12.4902 30.8125H17.4871V40.8062H12.4902V30.8125Z"></path>
                </svg>
            )
        },
        {
            id: "topicFeeling",
            title: t("topicFeeling"),
            description: t("topicFeelingDesc"),
            icon: (
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-primary size-5 md:size-6">
                    <path d="M26.65 4.1626C25.9874 4.1626 25.3519 4.42583 24.8833 4.89437C24.4148 5.36292 24.1516 5.99841 24.1516 6.66104V18.3204C24.1516 18.983 24.4148 19.6185 24.8833 20.0871C25.3519 20.5556 25.9874 20.8188 26.65 20.8188C27.9332 20.8194 29.1804 21.2433 30.1982 22.0248C31.2159 22.8063 31.9474 23.9018 32.2792 25.1414C32.6109 26.381 32.5244 27.6954 32.033 28.8808C31.5417 30.0662 30.6729 31.0564 29.5615 31.6978C28.4501 32.3392 27.1581 32.5959 25.8859 32.4282C24.6136 32.2605 23.4323 31.6778 22.525 30.7703C21.6178 29.8629 21.0352 28.6814 20.8678 27.4092C20.7004 26.1369 20.9574 24.845 21.599 23.7337C21.7633 23.4495 21.87 23.1357 21.913 22.8103C21.956 22.4848 21.9345 22.1541 21.8496 21.837C21.7647 21.5199 21.6181 21.2226 21.4183 20.9622C21.2185 20.7018 20.9693 20.4833 20.685 20.3192L10.5871 14.4895C10.0131 14.1584 9.33114 14.069 8.69118 14.2408C8.05123 14.4126 7.50573 14.8316 7.17469 15.4056C4.69976 19.6923 3.70845 24.6758 4.35448 29.5833C5.00051 34.4908 7.24779 39.048 10.7478 42.5482C14.2478 46.0483 18.8049 48.2958 23.7124 48.942C28.6198 49.5883 33.6034 48.5971 37.8902 46.1224C42.177 43.6477 45.5274 39.8276 47.4219 35.2546C49.3164 30.6817 49.649 25.6114 48.3682 20.8301C47.0874 16.0489 44.2647 11.8238 40.338 8.81027C36.4112 5.7967 31.5998 4.16302 26.65 4.1626ZM10.4102 20.1547L16.2815 23.5442C15.9791 24.5513 15.8248 25.597 15.8234 26.6485C15.8234 26.7526 15.8234 26.8567 15.8234 26.9608L9.27962 28.7139C9.19895 28.0284 9.15932 27.3387 9.16094 26.6485C9.16237 24.4243 9.58629 22.2207 10.4102 20.1547ZM10.583 33.5421L17.1268 31.787C17.8534 33.129 18.8544 34.3029 20.0647 35.2323C21.275 36.1618 22.6675 36.8259 24.1516 37.1815V43.9565C21.1884 43.5233 18.3855 42.3389 16.0097 40.5159C13.6338 38.6929 11.7642 36.2922 10.5788 33.5421H10.583ZM29.1526 43.9523V37.1815C31.5234 36.6185 33.6349 35.2721 35.1456 33.3601C36.6563 31.4482 37.4779 29.0826 37.4774 26.6459C37.4769 24.2091 36.6544 21.8438 35.143 19.9325C33.6315 18.0211 31.5194 16.6756 29.1484 16.1135V9.33645C33.3113 9.93675 37.1184 12.0171 39.872 15.1963C42.6256 18.3755 44.1413 22.4405 44.1413 26.6465C44.1413 30.8524 42.6256 34.9174 39.872 38.0966C37.1184 41.2758 33.3113 43.3562 29.1484 43.9565L29.1526 43.9523Z"></path>
                </svg>
            )
        },
        {
            id: "trendSummary",
            title: t("trendSummary"),
            description: t("trendSummaryDesc"),
            icon: (
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-primary size-5 md:size-6">
                    <path d="M49.134 43.3046C49.134 43.9672 48.8708 44.6027 48.4022 45.0713C47.9337 45.5398 47.2982 45.803 46.6355 45.803H6.66055C5.99792 45.803 5.36243 45.5398 4.89388 45.0713C4.42534 44.6027 4.16211 43.9672 4.16211 43.3046V9.99209C4.16211 9.32946 4.42534 8.69398 4.89388 8.22543C5.36243 7.75688 5.99792 7.49365 6.66055 7.49365C7.32317 7.49365 7.95866 7.75688 8.42721 8.22543C8.89576 8.69398 9.15898 9.32946 9.15898 9.99209V30.6042L18.2179 21.5432C18.45 21.3103 18.7258 21.1255 19.0295 20.9994C19.3332 20.8733 19.6588 20.8084 19.9876 20.8084C20.3165 20.8084 20.6421 20.8733 20.9457 20.9994C21.2494 21.1255 21.5252 21.3103 21.7574 21.5432L26.648 26.4401L35.6008 17.4874H33.3105C32.6479 17.4874 32.0124 17.2242 31.5439 16.7556C31.0753 16.2871 30.8121 15.6516 30.8121 14.989C30.8121 14.3263 31.0753 13.6909 31.5439 13.2223C32.0124 12.7538 32.6479 12.4905 33.3105 12.4905H41.6387C42.3013 12.4905 42.9368 12.7538 43.4053 13.2223C43.8739 13.6909 44.1371 14.3263 44.1371 14.989V23.3171C44.1371 23.9797 43.8739 24.6152 43.4053 25.0838C42.9368 25.5523 42.3013 25.8155 41.6387 25.8155C40.976 25.8155 40.3406 25.5523 39.872 25.0838C39.4035 24.6152 39.1402 23.9797 39.1402 23.3171V21.0269L28.4157 31.7535C28.1836 31.9864 27.9078 32.1712 27.6041 32.2973C27.3004 32.4234 26.9748 32.4883 26.646 32.4883C26.3171 32.4883 25.9915 32.4234 25.6879 32.2973C25.3842 32.1712 25.1084 31.9864 24.8762 31.7535L19.9855 26.8565L9.15898 37.6831V40.8062H46.6355C47.2982 40.8062 47.9337 41.0694 48.4022 41.5379C48.8708 42.0065 49.134 42.642 49.134 43.3046Z"></path>
                </svg>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-lg shadow-[0px_11px_15px_-7px_rgba(0,0,0,0.2),0px_24px_38px_3px_rgba(0,0,0,0.14),0px_9px_46px_8px_rgba(0,0,0,0.12)] w-full max-w-[600px] overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 md:p-6 border-b">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t("pickModule")}</h2>
                    <button
                        onClick={onClose}
                        disabled={isActionLoading}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 md:p-6">
                    <div className="py-2 md:py-4 space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => !isActionLoading && onSelectModule(module.title)}
                                className={cn(
                                    "p-3 md:p-4 border border-border rounded-lg cursor-pointer hover:bg-background-child transition-colors group",
                                    isActionLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded text-primary shrink-0 transition-transform group-hover:scale-110">
                                        {isActionLoading ? (
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            module.icon
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">
                                            {module.title}
                                        </h4>
                                        <p className="text-xs md:text-sm text-gray-800 line-clamp-2 md:line-clamp-none leading-relaxed">
                                            {module.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
