import * as React from 'react';

// ─── Public option types ───────────────────────────────────────────────────

export interface AlertOptions {
    title: string;
    description?: string;
    confirmText?: string;
}

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}

export interface DialogContextValue {
    alert: (options: AlertOptions) => Promise<void>;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ───────────────────────────────────────────────────────────────

export const DialogContext = React.createContext<DialogContextValue | null>(null);

// ─── Module-level singleton bridge ────────────────────────────────────────

let _contextRef: DialogContextValue | null = null;

export function setDialogRef(ref: DialogContextValue | null) {
    _contextRef = ref;
}

export const dialog: DialogContextValue = {
    alert: (options) =>
        _contextRef?.alert(options) ??
        Promise.reject(
            new Error('[dialog] DialogProvider가 마운트되지 않았습니다. App.tsx에 <DialogProvider>를 추가하세요.'),
        ),
    confirm: (options) =>
        _contextRef?.confirm(options) ??
        Promise.reject(
            new Error('[dialog] DialogProvider가 마운트되지 않았습니다. App.tsx에 <DialogProvider>를 추가하세요.'),
        ),
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDialog(): DialogContextValue {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error(
            '[useDialog] DialogProvider 외부에서 호출되었습니다. App.tsx에 <DialogProvider>를 추가하세요.',
        );
    }
    return context;
}
