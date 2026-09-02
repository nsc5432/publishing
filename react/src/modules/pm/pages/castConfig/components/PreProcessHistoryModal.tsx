import { useState } from 'react';
import type { CSSProperties } from 'react';
import { formatCount } from '@/lib/format';
import type { ApplyHistory } from '../types';
import { Pagination } from './Pagination';

interface PreProcessHistoryModalProps {
    histories: ApplyHistory[];
    reverting: boolean;
    onRevert: (sn: number) => void;
    onClose: () => void;
}

const PAGE_SIZE = 5;
const TBL_COLS = '1.6fr 2fr 1fr 1fr 1fr 84px';

export function PreProcessHistoryModal({ histories, reverting, onRevert, onClose }: PreProcessHistoryModalProps) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(histories.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = histories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="cast-config-layer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="cast-config-layer is-wide" role="dialog" aria-modal="true" aria-labelledby="cast-config-pre-prcs-hstry-title">
                <header className="cast-config-layer__header">
                    <h3 id="cast-config-pre-prcs-hstry-title">전처리 반영 이력</h3>
                    <button type="button" className="cast-config-icon-button" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="cast-config-layer__body">
                    <p className="cast-config-layer__lead">• 기준정보 반영 이력</p>
                    <p className="cast-config-layer__hint">되돌리면 반영 직전 값으로 복원됩니다.</p>

                    <div className="cast-config-category-table" style={{ '--cat-cols': TBL_COLS } as CSSProperties}>
                        <div className="cast-config-category-table__head">
                            <div>반영일시</div>
                            <div>시트</div>
                            <div>행수</div>
                            <div>반영자</div>
                            <div>상태</div>
                            <div>되돌리기</div>
                        </div>

                        {pageRows.map((history) => (
                            <div className="cast-config-category-table__row" key={history.sn}>
                                <div>{history.appliedAt}</div>
                                <div>{history.sheetName}</div>
                                <div>{formatCount(history.rowCount)}</div>
                                <div>{history.appliedBy}</div>
                                <div>{history.canceled ? '되돌림' : '반영'}</div>
                                <div>
                                    <button
                                        type="button"
                                        className="cast-config-ghost-button is-compact"
                                        disabled={history.canceled || reverting}
                                        onClick={() => onRevert(history.sn)}
                                    >
                                        되돌리기
                                    </button>
                                </div>
                            </div>
                        ))}

                        {pageRows.length === 0 && <p className="cast-config-category-table__empty">반영 이력이 없습니다.</p>}
                    </div>
                </div>

                <footer className="cast-config-layer__footer is-center">
                    <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </footer>
            </section>
        </div>
    );
}
