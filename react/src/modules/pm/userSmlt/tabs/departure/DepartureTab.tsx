import './departure.css';
import { useState } from 'react';
import type { TimeRange } from '@/components/ui/time-range-selector';
import { SummaryMapButton } from '../../components/SummaryMapButton';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { GateRow } from './components/GateRow';
import { DEPARTURE, toGateState } from './mock';
import type { GateState } from './types';

interface DepartureTabProps {
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (출국장별 사용 여부 / 운영 시간) */
type EditState = Record<TerminalKind, GateState>;

const INITIAL_EDIT: EditState = {
    T1: toGateState('T1'),
    T2: toGateState('T2'),
};

/**
 * 출국장 탭 — html/출국장/index.html 이식.
 * 터미널별 편집 상태를 각각 들고 있어 터미널을 오가도 값이 보존된다.
 */
export function DepartureTab({ activeTerminal, onTerminalChange }: DepartureTabProps) {
    const [edit, setEdit] = useState<EditState>(INITIAL_EDIT);

    const patchGate = (
        terminal: TerminalKind,
        id: string,
        next: Partial<{ off: boolean; ranges: TimeRange[] }>,
    ) => {
        setEdit((prev) => ({
            ...prev,
            [terminal]: { ...prev[terminal], [id]: { ...prev[terminal][id], ...next } },
        }));
    };

    const handleSave = (terminal: TerminalKind) => {
        // 실제 저장 연동 전: 현재 편집 상태만 확인한다.
        console.log('[현재상태 저장]', { terminal, gates: edit[terminal] });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const { gates } = DEPARTURE[terminal];
                const state = edit[terminal];
                const active = terminal === activeTerminal;

                // 원본 script.js 의 refreshCount() — 미사용이 아닌 출국장 수
                const operatingCount = gates.filter((gate) => !state[gate.id].off).length;

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => onTerminalChange(terminal)}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체</span>
                                    <strong className="summary__value">{gates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value summary__value--accent">
                                        {operatingCount}
                                    </strong>
                                </div>
                                <SummaryMapButton
                                    disabled={!active}
                                    onClick={() => console.log('[지도 보기]', { terminal })}
                                />
                            </>
                        }
                        footer={
                            <button
                                type="button"
                                className="btn btn--save"
                                onClick={() => handleSave(terminal)}
                            >
                                현재상태 저장
                            </button>
                        }
                    >
                        <div className="gate-list scroll-area">
                            {gates.map((gate) => (
                                <GateRow
                                    key={gate.id}
                                    gate={gate}
                                    off={state[gate.id].off}
                                    onOffChange={(off) => patchGate(terminal, gate.id, { off })}
                                    ranges={state[gate.id].ranges}
                                    onRangesChange={(ranges) =>
                                        patchGate(terminal, gate.id, { ranges })
                                    }
                                    disabled={!active}
                                />
                            ))}
                        </div>
                    </TerminalPanel>
                );
            })}
        </>
    );
}
