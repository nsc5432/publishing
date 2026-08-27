import * as React from 'react';

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

export const DialogContext = React.createContext<DialogContextValue | null>(null);

let dialogRef: DialogContextValue | null = null;

export function setDialogRef(provider: DialogContextValue | null) {
    dialogRef = provider;
}

export const dialog: DialogContextValue = {
    alert: (options) =>
        dialogRef?.alert(options) ?? Promise.reject(new Error('[dialog] DialogProvider가 마운트되지 않았습니다. App.tsx에 <DialogProvider>를 추가하세요.')),
    confirm: (options) =>
        dialogRef?.confirm(options) ?? Promise.reject(new Error('[dialog] DialogProvider가 마운트되지 않았습니다. App.tsx에 <DialogProvider>를 추가하세요.')),
};

export function useDialog(): DialogContextValue {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error('[useDialog] DialogProvider 외부에서 호출되었습니다. App.tsx에 <DialogProvider>를 추가하세요.');
    }
    return context;
}
