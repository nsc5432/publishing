import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { MapWhiteIcon, T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { PanelKpi, TerminalKind } from '../types';

interface TerminalPanelProps {
    terminal: TerminalKind;
    /** 시뮬레이션 대상으로 켰는가 — 끄면 회색 패널이 되고 편집이 잠긴다 */
    enabled: boolean;
    /** 편집 도크·드로어가 이 패널을 보고 있는가 (둘 다 켜져 있을 때만 갈린다) */
    focused: boolean;
    /** 끌 수 있는가 — 마지막 남은 1개는 끄지 못한다 */
    canDisable: boolean;
    /** 헤드 스위치 — 이 터미널을 켜고 끈다 */
    onToggle: () => void;
    /** 패널을 눌렀을 때 — 켜져 있으면 편집 초점을 가져온다 */
    onFocus: () => void;
    summary: ReactNode;
    kpis?: PanelKpi[];
    onMapClick?: () => void;
    footer?: ReactNode;
    /** 조회 전용 — 저장 버튼과 대상 스위치를 그리지 않는다 */
    readOnly?: boolean;
    children: ReactNode;
}

const LOCKED_HINT = '터미널 1개는 시뮬레이션 대상으로 남겨 둬야 합니다.';

/**
 * T1/T2 패널.
 *
 * 두 패널은 각각 켜고 끈다. 꺼진 패널은 회색으로 잠기고(`.panel--disabled` 가
 * 안쪽 pointer-events 를 끈다) 아무 데나 누르면 다시 켜진다.
 * 둘 다 켜져 있을 때는 마지막으로 만진 쪽이 편집 초점(`.panel--focus`)을 갖는다.
 */
export function TerminalPanel({
    terminal,
    enabled,
    focused,
    canDisable,
    onToggle,
    onFocus,
    summary,
    kpis,
    onMapClick,
    footer,
    readOnly,
    children,
}: TerminalPanelProps) {
    const BadgeIcon = terminal === 'T1' ? T1WhiteIcon : T2WhiteIcon;
    const locked = enabled && !canDisable;

    /** 스위치 클릭이 패널 클릭(초점 이동)까지 겹쳐 일어나지 않게 막는다 */
    const handleToggle = (event: ReactMouseEvent) => {
        event.stopPropagation();
        onToggle();
    };

    return (
        <section
            className={`panel ${enabled ? 'panel--active' : 'panel--disabled'}${
                enabled && focused ? ' panel--focus' : ''
            }`}
            aria-disabled={enabled ? undefined : true}
            onClick={enabled || readOnly ? onFocus : onToggle}
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
                            disabled={!enabled}
                            onClick={onMapClick}
                        >
                            <MapWhiteIcon aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {children}

            {/* 헤드는 요약·결과지표로 꽉 차 스위치가 들어갈 자리가 없다 — 바닥 오른쪽에 둔다.
                조회 전용이면 안이 비지만 칸은 남긴다 (세로 flex 사슬이 끊기지 않게) */}
            <div className="panel__foot">
                {!readOnly && (
                    <>
                        {enabled ? footer : null}

                        <button
                            type="button"
                            className={`tswitch${enabled ? ' is-on' : ''}`}
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${terminal} 시뮬레이션 대상`}
                            disabled={locked}
                            title={locked ? LOCKED_HINT : undefined}
                            onClick={handleToggle}
                        >
                            <span className="tswitch__track" aria-hidden="true">
                                <i className="tswitch__knob" />
                            </span>
                            <span className="tswitch__text">
                                {terminal} {enabled ? '사용' : '미사용'}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
