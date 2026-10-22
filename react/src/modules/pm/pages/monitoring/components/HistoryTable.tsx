import type { CSSProperties } from 'react';
import { HISTORY_LABEL, RUN_STATUS_LABEL, type HistoryKind, type HistoryRow } from '../types';

interface HistoryTableProps {
    kind: HistoryKind;
    rows: HistoryRow[];
    onView?: (row: HistoryRow) => void;
    onViewConfig?: (row: HistoryRow) => void;
    userId?: string;
    cancelPending?: boolean;
    onCancel?: (row: HistoryRow) => void;
}

const COLUMNS: Record<HistoryKind, string[]> = {
    standard: ['번호', '시작일시', '종료일시', '소요시간', '상태', '결과'],
    user: ['번호', '부서', '성명', '시작일시', '종료일시', '소요시간', '상태', '조건', '결과', '취소'],
};

const TBL_COLS: Record<HistoryKind, string> = {
    standard: '54px 1.7fr 1.7fr 0.85fr 0.8fr 74px',
    user: '54px 1.15fr 0.9fr 1.7fr 1.7fr 0.85fr 0.8fr 64px 64px 64px',
};

export function HistoryTable({
    kind, rows, onView, onViewConfig, userId, cancelPending, onCancel,
}: HistoryTableProps) {
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
                        const hasResult = row.status === 'done';

                        return (
                            <div className="tbl__row" key={row.smltId}>
                                <div>{row.rowNo}</div>
                                {showUser && <div>{row.dept}</div>}
                                {showUser && <div>{row.name}</div>}
                                <div>{row.startAt}</div>
                                <div>{row.endAt}</div>
                                <div>{row.duration}</div>
                                <div className={`tbl__state is-${row.status}`}>{RUN_STATUS_LABEL[row.status]}</div>
                                {showUser && (
                                    <div>
                                        <button type="button" className="btn-view" onClick={() => onViewConfig?.(row)}>
                                            보기
                                        </button>
                                    </div>
                                )}
                                <div>
                                    <button type="button" className="btn-view" disabled={!hasResult} onClick={() => onView?.(row)}>
                                        보기
                                    </button>
                                </div>
                                {showUser && (
                                    <div>
                                        {row.status === 'waiting' && userId && row.rgtrId === userId && (
                                            <button
                                                type="button"
                                                className="btn-view"
                                                disabled={cancelPending}
                                                onClick={() => onCancel?.(row)}
                                            >
                                                취소
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
