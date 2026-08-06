import type { ReactNode } from 'react';
import { MapWhiteIcon, T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { PanelKpi, TerminalKind } from '../types';

interface TerminalPanelProps {
    terminal: TerminalKind;
    /** 선택(편집 가능)된 패널인지 */
    active: boolean;
    /** 비활성 패널을 클릭했을 때 — 활성 터미널을 이 패널로 바꾼다 */
    onActivate: () => void;
    /** .summary 영역 — 표시 항목이 탭마다 다르므로 슬롯으로 받는다 */
    summary: ReactNode;
    /** 구성 지표 오른쪽에 세로 구분선을 두고 붙는 시뮬레이션 결과 지표 */
    kpis?: PanelKpi[];
    /** 요약 우측 지도 보기 버튼 — 넘기지 않으면 그리지 않는다 */
    onMapClick?: () => void;
    /** .panel__foot — 비활성 패널에서는 렌더하지 않는다 (원본 script.js 동작) */
    footer?: ReactNode;
    children: ReactNode;
}

/**
 * T1/T2 패널 껍데기 — 3개 탭이 공용으로 쓴다.
 *
 * 원본 script.js 의 setPanelState(패널 클릭 시 활성/비활성 스왑 + 내부 컨트롤 disabled)를
 * "활성 터미널 1개" 상태로 대체했다. 내부 폼 컨트롤의 disabled 는 각 탭이 내려준다.
 * 리뉴얼 시안의 panelHead(구성 지표 + 결과 지표 + 지도 버튼)를 여기로 흡수했다.
 */
export function TerminalPanel({
    terminal,
    active,
    onActivate,
    summary,
    kpis,
    onMapClick,
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

                <div className="summary">
                    {summary}

                    {kpis && kpis.length > 0 && (
                        <>
                            <span className="summary__divider" aria-hidden="true" />
                            <div className="summary__kpis">
                                {kpis.map((kpi) => (
                                    <p key={kpi.label} className="summary__kpi">
                                        <span>{kpi.label}</span>
                                        <b>
                                            {kpi.value}
                                            <em>{kpi.unit}</em>
                                        </b>
                                    </p>
                                ))}
                            </div>
                        </>
                    )}

                    {onMapClick && (
                        <button
                            type="button"
                            className="summary__map"
                            aria-label="지도 보기"
                            disabled={!active}
                            onClick={onMapClick}
                        >
                            <MapWhiteIcon aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {children}

            <div className="panel__foot">{active ? footer : null}</div>
        </section>
    );
}
