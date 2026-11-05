import type { CSSProperties } from 'react';
import { HISTORY_LABEL, RUN_STATUS_LABEL, type HistoryKind, type HistoryRow, type UserExecAverage } from '../types';

interface HistoryTableProps {
    kind: HistoryKind;
    rows: HistoryRow[];
    onView?: (row: HistoryRow) => void;
    onViewConfig?: (row: HistoryRow) => void;
    userId?: string;
    cancelPending?: boolean;
    onCancel?: (row: HistoryRow) => void;
    collapsed?: boolean;
    onToggle?: () => void;
    userAverage?: UserExecAverage;
}

const COLUMNS: Record<HistoryKind, string[]> = {
    standard: ['번호', '시작일시', '종료일시', '소요시간(분)', '상태', '결과'],
    user: ['번호', '부서', '성명', '시작일시', '종료일시', '소요시간(분)', '상태', '조건', '결과', '취소'],
};

const TBL_COLS: Record<HistoryKind, string> = {
    standard: '54px 1.7fr 1.7fr 0.85fr 0.8fr 74px',
    user: '48px 1fr 0.8fr 1.7fr 1.7fr 0.8fr 1.4fr 54px 54px 54px',
};

export function HistoryTable({
    kind,
    rows,
    onView,
    onViewConfig,
    userId,
    cancelPending,
    onCancel,
    collapsed = false,
    onToggle,
    userAverage,
}: HistoryTableProps) {
    const showUser = kind === 'user';

    return (
        <section className="hist" data-collapsed={collapsed} data-kind={kind}>
            <div className="hist__head">
                <h2 className="hist__title">{showUser ? '시뮬레이션 이력' : '일일 시뮬레이션 이력'}</h2>
                <span className={`hist__badge hist__badge--${kind}`}>{HISTORY_LABEL[kind]}</span>
                {showUser && (
                    <span className="hist__average" title="현재 조회 기간에 완료된 사용자 시뮬레이션의 평균 수행시간입니다.">
                        사용자 평균 수행시간 <strong>{userAverage?.label ?? '-'}</strong>
                        <span> (완료 {userAverage?.sampleCount ?? 0}건)</span>
                    </span>
                )}
                {!showUser && (
                    <button
                        type="button"
                        className="hist__toggle"
                        aria-expanded={!collapsed}
                        aria-controls="monitoring-standard-history"
                        aria-label={`일일 시뮬레이션 ${collapsed ? '펼치기' : '접기'}`}
                        onClick={onToggle}
                    >
                        {collapsed ? '펼치기 ›' : '‹ 접기'}
                    </button>
                )}
            </div>

            <div
                className="tbl"
                id={!showUser ? 'monitoring-standard-history' : undefined}
                hidden={collapsed}
                style={{ '--tbl-cols': TBL_COLS[kind] } as CSSProperties}
            >
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
                                <div>{row.duration} 분</div>
                                <div className={`tbl__state is-${row.status}`}>
                                    {RUN_STATUS_LABEL[row.status]}
                                    {showUser && row.status === 'running' && (
                                        <span
                                            className="tbl__progress"
                                            title="경과시간 ÷ 사용자 평균 수행시간으로 추정합니다. 실제 완료 전까지 최대 99%로 표시합니다."
                                        >
                                            {row.progressPercent === null ? '산정 불가' : `약 ${row.progressPercent}%`}
                                            {row.progressPercent !== null && (
                                                <progress max={100} value={row.progressPercent} aria-label={`시뮬레이션 ${row.smltId} 예상 진행률`} />
                                            )}
                                        </span>
                                    )}
                                </div>
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
                                            <button type="button" className="btn-view" disabled={cancelPending} onClick={() => onCancel?.(row)}>
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
