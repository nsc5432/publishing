import type { CSSProperties } from 'react';
import { HISTORY_LABEL, RUN_STATUS_LABEL, type HistoryKind, type HistoryRow } from '../types';

interface HistoryTableProps {
    kind: HistoryKind;
    rows: HistoryRow[];
    onView?: (row: HistoryRow) => void;
}

/** 표준 시뮬레이션은 사용자가 돌린 게 아니라서 '부서'/'성명' 컬럼이 없다 */
const COLUMNS: Record<HistoryKind, string[]> = {
    standard: ['번호', '시작일시', '종료일시', '소요시간', '상태', '결과'],
    user: ['번호', '부서', '성명', '시작일시', '종료일시', '소요시간', '상태', '결과'],
};

const TBL_COLS: Record<HistoryKind, string> = {
    standard: '54px 1.7fr 1.7fr 0.85fr 0.8fr 74px',
    user: '54px 1.15fr 0.9fr 1.7fr 1.7fr 0.85fr 0.8fr 74px',
};

export function HistoryTable({ kind, rows, onView }: HistoryTableProps) {
    const showUser = kind === 'user';

    return (
        <section className="hist">
            <div className="hist__head">
                <h2 className="hist__title">시뮬레이션 이력</h2>
                <span className={`hist__badge hist__badge--${kind}`}>{HISTORY_LABEL[kind]}</span>
            </div>

            <div className="tbl" style={{ '--tbl-cols': TBL_COLS[kind] } as CSSProperties}>
                <div className="tbl__head">
                    {COLUMNS[kind].map((col) => (
                        <div key={col}>{col}</div>
                    ))}
                </div>

                <div className="tbl__body scroll-area">
                    {rows.map((row) => {
                        const isRunning = row.status === 'running';

                        return (
                            <div className="tbl__row" key={row.rowNo}>
                                <div>{row.rowNo}</div>
                                {showUser && <div>{row.dept}</div>}
                                {showUser && <div>{row.name}</div>}
                                <div>{row.startAt}</div>
                                <div>{row.endAt}</div>
                                <div>{row.duration}</div>
                                <div className={`tbl__state is-${row.status}`}>
                                    {RUN_STATUS_LABEL[row.status]}
                                </div>
                                <div>
                                    {/* 아직 끝나지 않은 시뮬레이션은 볼 결과가 없다 */}
                                    <button
                                        type="button"
                                        className="btn-view"
                                        disabled={isRunning}
                                        onClick={() => onView?.(row)}
                                    >
                                        보기
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
