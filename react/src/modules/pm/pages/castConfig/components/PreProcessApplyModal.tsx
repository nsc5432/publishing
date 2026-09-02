import { Fragment, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { formatCount } from '@/lib/format';
import type { PreProcessDiff, PreProcessRow } from '../types';
import { Pagination } from './Pagination';

interface PreProcessApplyModalProps {
    diff: PreProcessDiff;
    applying: boolean;
    onApply: (rowNoList: number[]) => void;
    onClose: () => void;
}

const PAGE_SIZE = 10;
const FIXED_COLS = '44px 2fr 2fr';
const VALUE_COLS = '1fr 1fr';

function toColumnTemplate(columnCount: number): string {
    return [FIXED_COLS, ...Array.from({ length: columnCount }, () => VALUE_COLS)].join(' ');
}

function toDelta(row: PreProcessRow, index: number): string {
    const base = Number(row.baseValues[index]);
    const next = Number(row.preValues[index]);

    if (!Number.isFinite(base) || !Number.isFinite(next)) return row.changed ? '변경' : '';

    const delta = next - base;
    if (delta === 0) return '';

    return delta > 0 ? `+${delta}` : String(delta);
}

export function PreProcessApplyModal({ diff, applying, onApply, onClose }: PreProcessApplyModalProps) {
    const [showAll, setShowAll] = useState(false);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<number>>(() => new Set(diff.rows.filter((row) => row.changed).map((row) => row.rowNo)));

    const visibleRows = useMemo(() => (showAll ? diff.rows : diff.rows.filter((row) => row.changed)), [diff.rows, showAll]);
    const applicableRows = useMemo(() => visibleRows.filter((row) => row.matched), [visibleRows]);
    const columnTemplate = useMemo(() => toColumnTemplate(diff.valueLabels.length), [diff.valueLabels.length]);

    const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = visibleRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const allSelected = applicableRows.length > 0 && applicableRows.every((row) => selected.has(row.rowNo));

    const toggleRow = (rowNo: number) => {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(rowNo)) next.delete(rowNo);
            else next.add(rowNo);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected((current) => {
            const next = new Set(current);
            for (const row of applicableRows) {
                if (allSelected) next.delete(row.rowNo);
                else next.add(row.rowNo);
            }
            return next;
        });
    };

    const handleShowAll = (next: boolean) => {
        setShowAll(next);
        setPage(1);
    };

    return (
        <div className="cast-config-layer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="cast-config-layer is-wide" role="dialog" aria-modal="true" aria-labelledby="cast-config-pre-prcs-title">
                <header className="cast-config-layer__header">
                    <h3 id="cast-config-pre-prcs-title">전처리 반영</h3>
                    <button type="button" className="cast-config-icon-button" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="cast-config-layer__body">
                    <p className="cast-config-layer__lead">• 전처리 결과</p>
                    <p className="cast-config-layer__hint">
                        {diff.preProcessName ? `${diff.preProcessName} · 갱신 ${diff.preProcessAt}` : '전처리 결과가 아직 적재되지 않았습니다.'}
                    </p>

                    <div className="cast-config-pre-prcs-head">
                        <span>
                            전처리 대상 {formatCount(diff.rows.length)}개 행 중 변경 {formatCount(diff.changedCount)}개
                        </span>
                        <label className="cast-config-pre-prcs-toggle">
                            <input type="checkbox" checked={showAll} onChange={(event) => handleShowAll(event.target.checked)} />
                            변경 없는 항목 포함
                        </label>
                    </div>

                    <div className="cast-config-category-table" style={{ '--cat-cols': columnTemplate } as CSSProperties}>
                        <div className="cast-config-category-table__head">
                            <div>
                                <input type="checkbox" aria-label="전체 선택" checked={allSelected} disabled={applicableRows.length === 0} onChange={toggleAll} />
                            </div>
                            <div>속성</div>
                            <div>상세</div>
                            {diff.valueLabels.map((label) => (
                                <Fragment key={label}>
                                    <div>{label} 현재</div>
                                    <div>{label} 전처리</div>
                                </Fragment>
                            ))}
                        </div>

                        {pageRows.map((row) => (
                            <div className={`cast-config-category-table__row${row.changed ? ' is-changed' : ''}`} key={row.rowNo}>
                                <div>
                                    <input
                                        type="checkbox"
                                        aria-label={`${row.attribute} ${row.detail} 선택`}
                                        checked={selected.has(row.rowNo)}
                                        disabled={!row.matched}
                                        onChange={() => toggleRow(row.rowNo)}
                                    />
                                </div>
                                <div>{row.attribute}</div>
                                <div>{row.detail}</div>
                                {diff.valueLabels.map((label, index) => (
                                    <Fragment key={label}>
                                        <div>{row.baseValues[index] ?? ''}</div>
                                        <div>
                                            {row.matched ? (row.preValues[index] ?? '') : '없음'}
                                            {row.matched && <span className="cast-config-pre-prcs-delta"> {toDelta(row, index)}</span>}
                                        </div>
                                    </Fragment>
                                ))}
                            </div>
                        ))}

                        {pageRows.length === 0 && (
                            <p className="cast-config-category-table__empty">
                                {diff.rows.length === 0 ? '이 시트에는 전처리 대상 항목이 없습니다.' : '변경된 항목이 없습니다.'}
                            </p>
                        )}
                    </div>
                </div>

                <footer className="cast-config-layer__footer">
                    <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                    <span className="cast-config-category-meta">{formatCount(selected.size)}개 행 선택</span>
                    <button type="button" className="cast-config-ghost-button" onClick={onClose}>
                        취소
                    </button>
                    <button type="button" className="cast-config-primary-button" disabled={selected.size === 0 || applying} onClick={() => onApply([...selected])}>
                        {applying ? '반영 중' : '기준정보에 반영'}
                    </button>
                </footer>
            </section>
        </div>
    );
}
