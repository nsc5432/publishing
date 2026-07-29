import './flightPax.css';
import { useState } from 'react';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { BarChart } from './components/BarChart';
import { FlightEditor } from './components/FlightEditor';
import { FLIGHT_PAX } from './mock';
import type { EditMode } from './types';

interface FlightPaxTabProps {
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (전체 비율 / 수정 방식) */
type EditState = Record<TerminalKind, { ratio: number; mode: EditMode }>;

const INITIAL_EDIT: EditState = {
    T1: { ratio: FLIGHT_PAX.T1.ratio, mode: 'ratio' },
    T2: { ratio: FLIGHT_PAX.T2.ratio, mode: 'ratio' },
};

/**
 * 운항편/여객수 탭 — html/운항편_여객수/index.html 이식.
 * 터미널별 편집 상태를 각각 들고 있어 터미널을 오가도 값이 보존된다.
 */
export function FlightPaxTab({ activeTerminal, onTerminalChange }: FlightPaxTabProps) {
    const [edit, setEdit] = useState<EditState>(INITIAL_EDIT);

    const patch = (terminal: TerminalKind, next: Partial<EditState[TerminalKind]>) => {
        setEdit((prev) => ({ ...prev, [terminal]: { ...prev[terminal], ...next } }));
    };

    const handleSave = (terminal: TerminalKind) => {
        // 실제 저장 연동 전: 현재 편집 상태만 확인한다.
        console.log('[현재상태 저장]', { terminal, ...edit[terminal] });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const data = FLIGHT_PAX[terminal];
                const active = terminal === activeTerminal;

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => onTerminalChange(terminal)}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">운항편</span>
                                    <strong className="summary__value">{data.flights}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">여객</span>
                                    <strong className="summary__value">{data.pax}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크</span>
                                    <strong className="summary__value summary__value--accent">
                                        {data.peak}
                                    </strong>
                                </div>
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
                        <BarChart data={data.flightChart} />
                        <BarChart data={data.paxChart} />

                        <FlightEditor
                            terminal={terminal}
                            ratio={edit[terminal].ratio}
                            onRatioChange={(ratio) => patch(terminal, { ratio })}
                            mode={edit[terminal].mode}
                            onModeChange={(mode) => patch(terminal, { mode })}
                            rows={data.rows}
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
