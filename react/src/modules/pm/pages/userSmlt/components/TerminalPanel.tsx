import type { ReactNode } from 'react';
import { MapWhiteIcon, T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { PanelKpi, TerminalKind } from '../types';

interface TerminalPanelProps {
    terminal: TerminalKind;
    active: boolean;
    onActivate: () => void;
    summary: ReactNode;
    kpis?: PanelKpi[];
    onMapClick?: () => void;
    footer?: ReactNode;
    children: ReactNode;
}

/**
 * T1/T2 패널
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
