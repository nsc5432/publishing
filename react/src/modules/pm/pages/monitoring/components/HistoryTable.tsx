import {
    HISTORY_LABEL,
    RUN_STATUS_LABEL,
    type HistoryKind,
    type HistoryRow,
} from '../types';

interface HistoryTableProps {
    kind: HistoryKind;
    rows: HistoryRow[];
    /** 결과 보기 (실제 화면 연동 지점) */
    onView?: (row: HistoryRow) => void;
}

const COLUMNS = ['번호', '부서', '성명', '시작일시', '종료일시', '소요시간', '상태', '결과'];

/**
 * 시뮬레이션 이력 표 — 표준 / 사용자 두 벌이 같은 구조를 쓴다.
 *
 * 화면 안에서 머리글을 고정하고 본문만 스크롤해야 해서
 * 다른 화면(대시보드)과 같이 table 이 아닌 CSS Grid div 로 짠다.
 */
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
                        const running = row.status === 'running';

                        return (
                            <div className="tbl__row" key={row.no}>
                                <div>{row.no}</div>
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
                                        disabled={running}
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
