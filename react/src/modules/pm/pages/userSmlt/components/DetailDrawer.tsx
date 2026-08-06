import type { ReactNode } from 'react';
import type { BlockColor } from '../types';

interface DetailDrawerProps {
    /** 헤드 좌측 뱃지 문자 (아일랜드 문자 / 출국장 번호) */
    badge: string;
    /** 뱃지 색 — 블럭 색과 맞춘다 */
    badgeColor: BlockColor;
    title: string;
    /** 부제 (예: T1 · 09:00 ~ 17:00 운영 (8시간)) */
    subtitle: string;
    onClose: () => void;
    /** 변경 버튼 */
    onConfirm: () => void;
    children: ReactNode;
}

/**
 * 우측 상세 드로어 껍데기 — 체크인 카운터 / 출국장 공용.
 *
 * 블럭을 클릭하면 본문 위에 380px 오버레이로 열린다(.panels 기준 absolute).
 * 본문 레이아웃을 밀어내지 않으므로 차트는 열림/닫힘과 무관하게 같은 자리에 있다.
 * 전역 오버레이(dialog / loading-bar)와 달리 탭 로컬 상태로만 제어한다.
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
    /** 제목 우측 보조 문구 */
    hint?: ReactNode;
    children: ReactNode;
}

/** 드로어 본문 섹션 (운영시간 / 자원 배정 / 셀프 서비스 …) */
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
