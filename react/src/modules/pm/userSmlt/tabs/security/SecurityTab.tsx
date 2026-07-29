import './security.css';
import { useState } from 'react';
import { MinusIcon, PlusWhiteIcon } from '@/components/icons';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { SecurityTable } from './components/SecurityTable';
import { EMPTY_DRAFT, SECURITY, toRowState } from './mock';
import type { SecurityDraft, SecurityRow } from './types';

interface SecurityTabProps {
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (선택 출국장 / 출국장별 운영계획 / 체크된 행 / 신규 입력값) */
interface TerminalEdit {
    selectedGate: number | null;
    rows: Record<number, SecurityRow[]>;
    checked: string[];
    draft: SecurityDraft;
}

type EditState = Record<TerminalKind, TerminalEdit>;

const INITIAL_EDIT: EditState = {
    T1: {
        selectedGate: SECURITY.T1.selectedGate,
        rows: toRowState('T1'),
        checked: [],
        draft: EMPTY_DRAFT,
    },
    T2: {
        selectedGate: SECURITY.T2.selectedGate,
        rows: toRowState('T2'),
        checked: [],
        draft: EMPTY_DRAFT,
    },
};

/** 동시 운영 검색대 수 = 운영계획 행 중 가장 큰 갯수 */
function maxCount(rows: SecurityRow[]): number {
    return rows.reduce((max, row) => Math.max(max, row.count), 0);
}

let rowSeq = 0;

/**
 * 보안 검색대 탭 — html/보안검색대/index.html 이식.
 *
 * 원본 script.js 의 gate-tab 클릭(요약·제목 갱신)과 시/분 입력 보정을 옮겼고,
 * 정적이던 추가/삭제 버튼은 신규 입력 행 ↔ 운영계획 표로 실제 동작하게 했다.
 */
export function SecurityTab({ activeTerminal, onTerminalChange }: SecurityTabProps) {
    const [edit, setEdit] = useState<EditState>(INITIAL_EDIT);

    const patch = (terminal: TerminalKind, next: Partial<TerminalEdit>) => {
        setEdit((prev) => ({ ...prev, [terminal]: { ...prev[terminal], ...next } }));
    };

    /** 신규 입력 행을 선택한 출국장의 운영계획에 더한다 */
    const handleAdd = (terminal: TerminalKind) => {
        const { selectedGate, draft, rows } = edit[terminal];
        if (selectedGate === null) return;

        const count = Number(draft.count);
        if (!count) return;

        const row: SecurityRow = {
            id: `new-${(rowSeq += 1)}`,
            startHour: draft.startHour.padStart(2, '0'),
            startMin: draft.startMin.padStart(2, '0'),
            endHour: draft.endHour.padStart(2, '0'),
            endMin: draft.endMin.padStart(2, '0'),
            count,
        };

        patch(terminal, {
            rows: { ...rows, [selectedGate]: [...rows[selectedGate], row] },
            draft: EMPTY_DRAFT,
        });
    };

    /** 체크된 행을 운영계획에서 뺀다 */
    const handleDelete = (terminal: TerminalKind) => {
        const { selectedGate, checked, rows } = edit[terminal];
        if (selectedGate === null || checked.length === 0) return;

        patch(terminal, {
            rows: {
                ...rows,
                [selectedGate]: rows[selectedGate].filter((row) => !checked.includes(row.id)),
            },
            checked: [],
        });
    };

    const handleSave = (terminal: TerminalKind) => {
        // 실제 저장 연동 전: 현재 편집 상태만 확인한다.
        const { selectedGate, rows } = edit[terminal];
        console.log('[현재상태 저장]', { terminal, selectedGate, rows });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const { gates } = SECURITY[terminal];
                const state = edit[terminal];
                const active = terminal === activeTerminal;

                const gateRows = state.selectedGate === null ? [] : state.rows[state.selectedGate];
                const seats = maxCount(gateRows);
                // 출국장을 고르기 전에는 표·추가/삭제를 잠근다 (원본의 안내 문구 상태)
                const locked = !active || state.selectedGate === null;

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => onTerminalChange(terminal)}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">출국장</span>
                                    <strong className="summary__value">{gates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">선택</span>
                                    <strong className="summary__value summary__value--accent">
                                        {state.selectedGate ?? ''}
                                    </strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">검색대</span>
                                    <strong className="summary__value">
                                        {state.selectedGate === null ? '' : seats}
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
                        <div className="sec-head">
                            <h3 className="sec-title">
                                {state.selectedGate === null ? (
                                    '출국장을 선택하면 보안검색대 운영계획이 표시됩니다'
                                ) : (
                                    <>
                                        <strong>{state.selectedGate}</strong>번 출국장{' '}
                                        <strong>{seats}</strong>개 보안검색대 운영예정
                                    </>
                                )}
                            </h3>
                            <div className="sec-actions">
                                <button
                                    type="button"
                                    className="btn btn--add"
                                    disabled={locked}
                                    onClick={() => handleAdd(terminal)}
                                >
                                    <PlusWhiteIcon aria-hidden="true" />
                                    <span>추가</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--del"
                                    disabled={locked || state.checked.length === 0}
                                    onClick={() => handleDelete(terminal)}
                                >
                                    <MinusIcon aria-hidden="true" />
                                    <span>삭제</span>
                                </button>
                            </div>
                        </div>

                        <SecurityTable
                            rows={gateRows}
                            checked={state.checked}
                            onCheckedChange={(checked) => patch(terminal, { checked })}
                            draft={state.draft}
                            onDraftChange={(draft) => patch(terminal, { draft })}
                            disabled={locked}
                        />

                        <div className="gate-tabs">
                            {gates.map((gate) => (
                                <button
                                    key={gate.no}
                                    type="button"
                                    className={`gate-tab${gate.no === state.selectedGate ? ' is-active' : ''}`}
                                    aria-pressed={gate.no === state.selectedGate}
                                    disabled={!active}
                                    onClick={() =>
                                        patch(terminal, { selectedGate: gate.no, checked: [] })
                                    }
                                >
                                    {gate.no}출국장
                                </button>
                            ))}
                        </div>
                    </TerminalPanel>
                );
            })}
        </>
    );
}
