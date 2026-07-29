import { useState } from 'react';
import { TimeRangeSelector, type TimeRange } from '@/components/ui/time-range-selector';
import { IslandPicker } from '../../components/IslandPicker';
import { SummaryMapButton } from '../../components/SummaryMapButton';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { CounterGrid } from './components/CounterGrid';
import { CHECKIN_COUNTER } from './mock';

interface CheckinCounterTabProps {
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (아일랜드 / 운영 카운터 / 운영 시간) */
type EditState = Record<TerminalKind, { island: string; operating: string[]; ranges: TimeRange[] }>;

const INITIAL_EDIT: EditState = {
    T1: {
        island: CHECKIN_COUNTER.T1.island,
        operating: CHECKIN_COUNTER.T1.operating,
        ranges: CHECKIN_COUNTER.T1.ranges,
    },
    T2: {
        island: CHECKIN_COUNTER.T2.island,
        operating: CHECKIN_COUNTER.T2.operating,
        ranges: CHECKIN_COUNTER.T2.ranges,
    },
};

/**
 * 체크인 카운터 탭 — html/체크인카운터/index.html 이식.
 * 터미널별 편집 상태를 각각 들고 있어 터미널을 오가도 값이 보존된다.
 */
export function CheckinCounterTab({ activeTerminal, onTerminalChange }: CheckinCounterTabProps) {
    const [edit, setEdit] = useState<EditState>(INITIAL_EDIT);

    const patch = (terminal: TerminalKind, next: Partial<EditState[TerminalKind]>) => {
        setEdit((prev) => ({ ...prev, [terminal]: { ...prev[terminal], ...next } }));
    };

    const toggleCounter = (terminal: TerminalKind, id: string) => {
        setEdit((prev) => {
            const { operating } = prev[terminal];
            const next = operating.includes(id)
                ? operating.filter((it) => it !== id)
                : [...operating, id];

            return { ...prev, [terminal]: { ...prev[terminal], operating: next } };
        });
    };

    const handleSave = (terminal: TerminalKind) => {
        // 실제 저장 연동 전: 현재 편집 상태만 확인한다.
        console.log('[현재상태 저장]', { terminal, ...edit[terminal] });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const data = CHECKIN_COUNTER[terminal];
                const state = edit[terminal];
                const active = terminal === activeTerminal;
                const operatingCount = state.operating.length;

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
                                    <strong className="summary__value">{data.total}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value">{operatingCount}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">아일랜드</span>
                                    <strong className="summary__value summary__value--island">
                                        {state.island}
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
                        <CounterGrid
                            upper={data.upper}
                            lower={data.lower}
                            operating={state.operating}
                            onToggle={(id) => toggleCounter(terminal, id)}
                            disabled={!active}
                        />

                        <div className="timebox">
                            <div className="timebox__info">
                                <p className="timebox__line">
                                    <span>카운터</span>
                                    <strong>{operatingCount}</strong>
                                </p>
                            </div>
                            <TimeRangeSelector
                                ranges={state.ranges}
                                onChange={(ranges) => patch(terminal, { ranges })}
                                disabled={!active}
                            />
                        </div>

                        <IslandPicker
                            islands={data.islands}
                            value={state.island}
                            onChange={(island) => patch(terminal, { island })}
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
