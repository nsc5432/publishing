import { HISTORY_LABEL, RUN_STATUS_LABEL, type HistoryKind, type HistoryRow } from '../types';

interface HistoryTableProps {
    kind: HistoryKind;
    rows: HistoryRow[];
    onView?: (row: HistoryRow) => void;
}

const COLUMNS = ['번호', '부서', '성명', '시작일시', '종료일시', '소요시간', '상태', '결과'];

export function HistoryTable({ kind, rows, onView }: HistoryTableProps) {
    return (
        <section className="hist">
            <div className="hist__head">
                <h2 className="hist__title">시뮬레이션 이력</h2>
                <span className={`hist__badge hist__badge--${kind}`}>{HISTORY_LABEL[kind]}</span>
            </div>

            <div className="tbl">
                <div className="tbl__head">
                    {COLUMNS.map((col) => (
                        <div key={col}>{col}</div>
                    ))}
                </div>

                <div className="tbl__body scroll-area">
                    {rows.map((row) => {
                        const isRunning = row.status === 'running';

                        return (
                            <div className="tbl__row" key={row.rowNo}>
                                <div>{row.rowNo}</div>
                                <div>{row.dept}</div>
                                <div>{row.name}</div>
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
