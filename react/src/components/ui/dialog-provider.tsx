import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DialogContext, setDialogRef, type AlertOptions, type ConfirmOptions, type DialogContextValue } from '@/lib/dialog';

interface DialogState {
    open: boolean;
    variant: 'alert' | 'confirm';
    title: string;
    description?: string;
    confirmText: string;
    cancelText: string;
    // setState가 resolve를 updater로 실행하지 않도록 객체로 감싼다.
    resolve: { fn: (value: boolean) => void } | null;
}

const INITIAL_STATE: DialogState = {
    open: false,
    variant: 'confirm',
    title: '',
    description: undefined,
    confirmText: '확인',
    cancelText: '취소',
    resolve: null,
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<DialogState>(INITIAL_STATE);

    const alert = React.useCallback((options: AlertOptions): Promise<void> => {
        return new Promise<void>((resolve) => {
            setState({
                open: true,
                variant: 'alert',
                title: options.title,
                description: options.description,
                confirmText: options.confirmText ?? '확인',
                cancelText: '취소',
                resolve: { fn: () => resolve() },
            });
        });
    }, []);

    const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setState({
                open: true,
                variant: 'confirm',
                title: options.title,
                description: options.description,
                confirmText: options.confirmText ?? '확인',
                cancelText: options.cancelText ?? '취소',
                resolve: { fn: resolve },
            });
        });
    }, []);

    React.useEffect(() => {
        setDialogRef({ alert, confirm } satisfies DialogContextValue);
        return () => setDialogRef(null);
    }, [alert, confirm]);

    const handleConfirm = () => {
        state.resolve?.fn(true);
        setState(INITIAL_STATE);
    };

    const handleCancel = () => {
        state.resolve?.fn(false);
        setState(INITIAL_STATE);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && state.open) {
            state.resolve?.fn(false);
            setState(INITIAL_STATE);
        }
    };

    const contextValue = React.useMemo<DialogContextValue>(() => ({ alert, confirm }), [alert, confirm]);

    return (
        <DialogContext.Provider value={contextValue}>
            {children}

            <AlertDialog open={state.open} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state.title}</AlertDialogTitle>
                        {state.description && <AlertDialogDescription>{state.description}</AlertDialogDescription>}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {state.variant === 'confirm' && <AlertDialogCancel onClick={handleCancel}>{state.cancelText}</AlertDialogCancel>}
                        <AlertDialogAction onClick={handleConfirm}>{state.confirmText}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DialogContext.Provider>
    );
}
