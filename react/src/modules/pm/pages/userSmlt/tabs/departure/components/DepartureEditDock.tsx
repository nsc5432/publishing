import { useRef } from 'react';
import { T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import { CountStepper } from '../../../components/CountStepper';
import { TimeBar } from '../../../components/TimeBar';
import { formatOperating } from '../../../format';
import { useDockHeight } from '../../../hooks/useDockHeight';
import type { TerminalKind } from '../../../types';
import type { DepartureGate } from '../types';

interface DepartureEditDockProps {
    disabled: boolean;
    terminal: TerminalKind;
    gates: DepartureGate[];
    draft: DepartureGate;
    changed: boolean;
    onSelect: (no: number) => void;
    onPatch: (patch: Partial<DepartureGate>) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const GATE_NOS: Record<TerminalKind, number[]> = {
    T1: [1, 2, 3, 4, 5, 6],
    T2: [1, 2],
};

function toGuide(draft: DepartureGate, changed: boolean) {
    if (draft.off) return `${draft.no}번 출국장은 미사용입니다. 사용으로 바꾸면 운영시간을 정할 수 있습니다.`;
    if (changed) return '변경한 내용은 적용을 눌러 반영하세요.';
    return `${draft.no}번 출국장의 운영시간을 끌어서 정하고 검색대 수를 조정하세요.`;
}

export function DepartureEditDock({ disabled, terminal, gates, draft, changed, onSelect, onPatch, onConfirm, onCancel }: DepartureEditDockProps) {
    const dockRef = useRef<HTMLElement>(null);

    const BadgeIcon = terminal === 'T1' ? T1WhiteIcon : T2WhiteIcon;

    useDockHeight(dockRef);

    return (
        <section ref={dockRef} className="dock" data-editor="departure" aria-label="출국장 편집">
            <div className="dock__head">
                <span className="dock__tmnl" data-terminal={terminal} role="img" aria-label={terminal}>
                    <BadgeIcon aria-hidden="true" />
                </span>
                <div className="gatepick" role="group" aria-label="출국장 선택">
                    {GATE_NOS[terminal].map((no) => {
                        const gate = gates.find((candidate) => candidate.no === no);
                        const selectedGate = no === draft.no;

                        return (
                            <button
                                key={no}
                                type="button"
                                className={`gatepick__item${selectedGate ? ' is-on' : ''}` + `${gate?.off ? ' is-off' : ''}`}
                                aria-pressed={selectedGate}
                                disabled={!gate}
                                onClick={() => onSelect(no)}
                            >
                                <i className="gatepick__dot" style={gate && !gate.off ? { background: `var(--${gate.color})` } : undefined} />
                                {no}번
                            </button>
                        );
                    })}
                </div>
                {!disabled && (
                    <p className="dock__guide" role="status">
                        {toGuide(draft, changed)}
                    </p>
                )}
                <span className="dock__hint">{formatOperating(terminal, draft.ranges)}</span>
            </div>

            <div className="dock__cols">
                <section className="dock__col">
                    <p className="dsec__title">{draft.no}번 출국장</p>
                    <div className="drow">
                        <p className="drow__label">출국장 운영 여부</p>
                        <div className="seg">
                            <button
                                type="button"
                                className={`seg__item${draft.off ? '' : ' is-on'}`}
                                aria-pressed={!draft.off}
                                disabled={disabled}
                                onClick={() => onPatch({ off: false })}
                            >
                                사용
                            </button>
                            <button
                                type="button"
                                className={`seg__item${draft.off ? ' is-on' : ''}`}
                                aria-pressed={draft.off}
                                disabled={disabled}
                                onClick={() => onPatch({ off: true })}
                            >
                                미사용
                            </button>
                        </div>
                    </div>
                </section>

                <section className="dock__col">
                    <p className="dsec__title">
                        운영시간<span className="dsec__hint">1시간 단위</span>
                    </p>
                    <TimeBar label="선택 범위" ranges={draft.ranges} onChange={(ranges) => onPatch({ ranges })} disabled={disabled || draft.off} />
                </section>

                <section className="dock__col">
                    <p className="dsec__title">
                        검색대 구성<span className="dsec__hint">{draft.no}번 출국장 소속</span>
                    </p>
                    <CountStepper label="일반" value={draft.gnrlSrchCntom} onChange={(gnrlSrchCntom) => onPatch({ gnrlSrchCntom })} disabled={disabled} />
                    <CountStepper
                        label="스마트패스"
                        value={draft.smartPassSrchCntom}
                        onChange={(smartPassSrchCntom) => onPatch({ smartPassSrchCntom })}
                        disabled={disabled}
                    />
                    <CountStepper label="보안검색대" value={draft.scshCntom} onChange={(scshCntom) => onPatch({ scshCntom })} disabled={disabled} />
                </section>
            </div>

            <div className="dock__foot">
                <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={!changed}>
                    취소
                </button>
                <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={disabled || !changed}>
                    적용
                </button>
            </div>
        </section>
    );
}
