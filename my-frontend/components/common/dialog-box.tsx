"use client";

import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export function DialogBox({
    componentForTrigger,
    dialogTitle,
    componentForDialogContent,
    componentForClosedDialog,
    componentForDialogFooter,
    onSubmit,
    isOpen,
    onOpenChange,
}: {
    componentForTrigger?: React.ReactNode,
    dialogTitle: string,
    componentForClosedDialog: React.ReactNode,
    componentForDialogContent: React.ReactNode,
    componentForDialogFooter: React.ReactNode,
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void,
    isOpen?: boolean,
    onOpenChange?: (open: boolean) => void,
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {componentForTrigger && (
                <DialogTrigger asChild>
                    {componentForTrigger}
                </DialogTrigger>
            )}
            <DialogContent>
                <form onSubmit={(e) => {
                    if (onSubmit) {
                        e.preventDefault();
                        onSubmit(e);
                    }
                }}>
                    <DialogHeader>
                        <DialogTitle className="font-bold text-2xl">{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    {componentForDialogContent}
                    <DialogFooter className="justify-center!">
                        <DialogClose asChild>
                            {componentForClosedDialog}
                        </DialogClose>
                        {componentForDialogFooter}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
