import type { ReactNode } from 'react';
import type { BlockColor } from '../types';

interface DetailDrawerProps {
    badge: string;
    badgeColor: BlockColor;
    title: string;
    subtitle: string;
    onClose: () => void;
    onConfirm: () => void;
    children: ReactNode;
}

/**
 * 우측 상세 드로어 껍데기 — 체크인 카운터 / 출국장 공용.
 */
export function DetailDrawer({
    badge,
    badgeColor,
    title,
    subtitle,
    onClose,
    onConfirm,
    children,
}: DetailDrawerProps) {
    return (
        <aside className="drawer" role="dialog" aria-label={title}>
            <div className="drawer__head">
                <span className="drawer__badge" style={{ background: `var(--${badgeColor})` }}>
                    {badge}
                </span>
                <div className="drawer__titles">
                    <p className="drawer__title">{title}</p>
                    <p className="drawer__sub">{subtitle}</p>
                </div>
                <button type="button" className="drawer__close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="blind">닫기</span>
                </button>
            </div>

            <div className="drawer__body scroll-area">{children}</div>

            <div className="drawer__foot">
                <button type="button" className="btn btn--ghost" onClick={onClose}>
                    취소
                </button>
                <button type="button" className="btn btn--primary" onClick={onConfirm}>
                    변경
                </button>
            </div>
        </aside>
    );
}

interface DrawerSectionProps {
    title?: string;
    hint?: ReactNode;
    children: ReactNode;
}

/** 드로어 본문 섹션 */
export function DrawerSection({ title, hint, children }: DrawerSectionProps) {
    return (
        <div className="dsec">
            {(title || hint) && (
                <p className="dsec__title">
                    {title}
                    {hint && <span className="dsec__hint">{hint}</span>}
                </p>
            )}
            {children}
        </div>
    );
}
