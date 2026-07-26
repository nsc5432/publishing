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
import {
    DialogContext,
    setDialogRef,
    type AlertOptions,
    type ConfirmOptions,
    type DialogContextValue,
} from '@/lib/dialog';

// ─── Internal state ────────────────────────────────────────────────────────

interface DialogState {
    open: boolean;
    variant: 'alert' | 'confirm';
    title: string;
    description?: string;
    confirmText: string;
    cancelText: string;
    // React treats setState(fn) as an updater call, so the resolve function
    // must be wrapped in an object to prevent premature invocation.
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

// ─── Provider ──────────────────────────────────────────────────────────────

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

    // Register this instance in the module-level singleton on mount
    React.useEffect(() => {
        setDialogRef({ alert, confirm } satisfies DialogContextValue);
        return () => setDialogRef(null);
    }, [alert, confirm]);

    const handleConfirm = React.useCallback(() => {
        state.resolve?.fn(true);
        setState(INITIAL_STATE);
    }, [state.resolve]);

    const handleCancel = React.useCallback(() => {
        state.resolve?.fn(false);
        setState(INITIAL_STATE);
    }, [state.resolve]);

    // Fired when Radix closes the dialog (ESC key)
    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open && state.open) {
                state.resolve?.fn(false);
                setState(INITIAL_STATE);
            }
        },
        [state.open, state.resolve],
    );

    const contextValue = React.useMemo<DialogContextValue>(
        () => ({ alert, confirm }),
        [alert, confirm],
    );

    return (
        <DialogContext.Provider value={contextValue}>
            {children}

            <AlertDialog open={state.open} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{state.title}</AlertDialogTitle>
                        {state.description && (
                            <AlertDialogDescription>{state.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {state.variant === 'confirm' && (
                            <AlertDialogCancel onClick={handleCancel}>
                                {state.cancelText}
                            </AlertDialogCancel>
                        )}
                        <AlertDialogAction onClick={handleConfirm}>
                            {state.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DialogContext.Provider>
    );
}
