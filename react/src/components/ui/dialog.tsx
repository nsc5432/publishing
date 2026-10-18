import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

/**
 * 입력 폼을 담는 일반 다이얼로그.
 *
 * 확인/알림 전용인 alert-dialog 와 달리 내용 구성은 화면이 정한다. 포커스 트랩 / ESC / 배경 스크롤
 * 차단 / 닫을 때 원래 버튼으로 포커스 복귀는 Radix 가 맡고, 틀은 common.css 의 `.dialog__*` 가 맡는다.
 * body 로 포털되므로 화면의 zoom / overflow 영향을 받지 않는다.
 */

function join(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogContent({
    className,
    overlayClassName,
    onCloseAutoFocus,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
    const [returnFocus] = React.useState(() => document.activeElement as HTMLElement | null);

    // Radix 는 Dialog.Trigger 로 열었을 때만 포커스를 되돌린다. 상태로 연 다이얼로그도 연 버튼으로 돌려보낸다
    const handleCloseAutoFocus = (event: Event) => {
        onCloseAutoFocus?.(event);
        if (event.defaultPrevented) return;

        event.preventDefault();
        returnFocus?.focus();
    };

    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay data-slot="dialog-overlay" className={join('dialog__overlay', overlayClassName)} />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={join('dialog__content', className)}
                onCloseAutoFocus={handleCloseAutoFocus}
                {...props}
            />
        </DialogPrimitive.Portal>
    );
}

function DialogTitle({ ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title data-slot="dialog-title" {...props} />;
}

function DialogDescription({ ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return <DialogPrimitive.Description data-slot="dialog-description" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose };
