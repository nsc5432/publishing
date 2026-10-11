import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { MapWhiteIcon, T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { PanelKpi, TerminalKind } from '../types';

interface TerminalPanelProps {
    terminal: TerminalKind;

    enabled: boolean;

    focused: boolean;

    canDisable: boolean;

    onToggle: () => void;

    onFocus: () => void;
    summary: ReactNode;
    kpis?: PanelKpi[];
    onMapClick?: () => void;
    footer?: ReactNode;

    readOnly?: boolean;
    children: ReactNode;
}

const LOCKED_HINT = '편집할 터미널을 한 개 이상 선택해주세요.';

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

    const handleToggle = (event: ReactMouseEvent) => {
        event.stopPropagation();
        onToggle();
    };

    return (
        <section
            className={`panel ${enabled ? 'panel--active' : 'panel--disabled'}${enabled && focused ? ' panel--focus' : ''}`}
            aria-disabled={enabled ? undefined : true}
            onClick={enabled || readOnly ? onFocus : onToggle}
        >
            <div className="panel__head">
                <div className={`terminal-badge terminal-badge--${terminal.toLowerCase()}`} aria-hidden="true">
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
                        <button type="button" className="summary__map" aria-label="지도 보기" disabled={!enabled} onClick={onMapClick}>
                            <MapWhiteIcon aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {children}

            <div className="panel__foot">
                {!readOnly && (
                    <>
                        {enabled ? footer : null}

                        <button
                            type="button"
                            className={`tswitch${enabled ? ' is-on' : ''}`}
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${terminal} 편집 선택`}
                            disabled={locked}
                            title={locked ? LOCKED_HINT : undefined}
                            onClick={handleToggle}
                        >
                            <span className="tswitch__track" aria-hidden="true">
                                <i className="tswitch__knob" />
                            </span>
                            <span className="tswitch__text">
                                {terminal} {enabled ? '편집' : '선택 안 함'}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
