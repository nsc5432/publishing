import type { ReactNode } from 'react';
import { T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { TerminalKind } from '../types';

interface TerminalPanelProps {
    terminal: TerminalKind;
    /** 선택(편집 가능)된 패널인지 */
    active: boolean;
    /** 비활성 패널을 클릭했을 때 — 활성 터미널을 이 패널로 바꾼다 */
    onActivate: () => void;
    /** .summary 영역 — 표시 항목이 탭마다 다르므로 슬롯으로 받는다 */
    summary: ReactNode;
    /** .panel__foot — 비활성 패널에서는 렌더하지 않는다 (원본 script.js 동작) */
    footer?: ReactNode;
    children: ReactNode;
}

/**
 * T1/T2 패널 껍데기 — 5개 탭이 공용으로 쓴다.
 *
 * 원본 script.js 의 setPanelState(패널 클릭 시 활성/비활성 스왑 + 내부 컨트롤 disabled)를
 * "활성 터미널 1개" 상태로 대체했다. 내부 폼 컨트롤의 disabled 는 각 탭이 내려준다.
 */
export function TerminalPanel({
    terminal,
    active,
    onActivate,
    summary,
    footer,
    children,
}: TerminalPanelProps) {
    const BadgeIcon = terminal === 'T1' ? T1WhiteIcon : T2WhiteIcon;

    return (
        <section
            className={`panel ${active ? 'panel--active' : 'panel--disabled'}`}
            aria-disabled={active ? undefined : true}
            onClick={active ? undefined : onActivate}
        >
            <div className="panel__head">
                <div
                    className={`terminal-badge terminal-badge--${terminal.toLowerCase()}`}
                    aria-hidden="true"
                >
                    <BadgeIcon />
                </div>
                <div className="summary">{summary}</div>
            </div>

            {children}

            <div className="panel__foot">{active ? footer : null}</div>
        </section>
    );
}
