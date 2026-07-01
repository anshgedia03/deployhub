"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProjectStore } from "@/store/useProjectStore";

export type ModalType = { type: "session" | "file"; name: string; id?: string } | null;

interface DeleteConfirmationModalProps {
    modal: ModalType;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function DeleteConfirmationModal({
    modal,
    onClose,
    onConfirm
}: DeleteConfirmationModalProps) {
    const t = useTranslations("Chat");
    const tFileManager = useTranslations("FileManager");
    const isActionLoading = useProjectStore((state) => state.isActionLoading);

    if (!modal) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full max-w-[600px] p-6 m-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-semibold text-slate-900">
                        {modal.type === "session" ? t("deleteSession") : t("deleteFile")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                    Are you sure you want to delete &quot;{modal.name}&quot;? This action cannot be undone.
                </p>

                <div className="flex items-center gap-3 justify-end sm:justify-center">
                    <button
                        onClick={onClose}
                        disabled={isActionLoading}
                        className="flex-1 px-6 py-2.5 border border-gray-200 text-slate-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {tFileManager("cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isActionLoading}
                        className="flex-1 px-6 py-2.5 bg-[#F43F5E] text-white text-[14px] font-medium rounded-lg hover:bg-[#E11D48] transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isActionLoading && (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {modal.type === "session" ? t("deleteSession") : t("deleteFile")}
                    </button>
                </div>
            </div>
        </div>
    );
}
