import './FcltMapTable.css';
import { useEffect, useRef } from 'react';
import { formatCount } from '@/lib/format';
import { FCLT_TYPE_LABEL, MAPPING_STATUS_LABEL, type FcltGroup, type FcltMapRow } from '../types';

interface FcltMapTableProps {
    rows: FcltMapRow[];
    groups: FcltGroup[];
    groupCode: string;
    keyword: string;
    page: number;
    totalPages: number;
    totalCount: number;
    selectedCode: string;
    markerNote: string;
    dirtyCodes: Set<string>;
    duplicateNames: Set<string>;
    onGroupChange: (groupCode: string) => void;
    onKeywordChange: (keyword: string) => void;
    onPageChange: (page: number) => void;
    onSelect: (row: FcltMapRow) => void;
    onCastChange: (code: string, castName: string) => void;
    onExcel: () => void;
}

interface PaginationProps {
    page: number;
    totalPages: number;
    totalCount: number;
    onChange: (page: number) => void;
}

const COLUMNS = ['시설그룹', '여객시설코드', '여객시설명', 'CAST 시뮬레이션명', '상태'];

const PAGE_WINDOW = 5;

function toPageNumbers(page: number, totalPages: number): number[] {
    const start = Math.max(1, Math.min(page - Math.floor(PAGE_WINDOW / 2), totalPages - PAGE_WINDOW + 1));
    const length = Math.min(PAGE_WINDOW, totalPages);

    return Array.from({ length }, (_, index) => start + index);
}

export function FcltMapTable({
    rows,
    groups,
    groupCode,
    keyword,
    page,
    totalPages,
    totalCount,
    selectedCode,
    markerNote,
    dirtyCodes,
    duplicateNames,
    onGroupChange,
    onKeywordChange,
    onPageChange,
    onSelect,
    onCastChange,
    onExcel,
}: FcltMapTableProps) {
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }, [page]);

    return (
        <section className="list">
            <div className="list__head">
                <div className="chips" role="group" aria-label="시설그룹 선택">
                    <button
                        type="button"
                        className={`chip${groupCode === '' ? ' is-active' : ''}`}
                        aria-pressed={groupCode === ''}
                        onClick={() => onGroupChange('')}
                    >
                        전체
                    </button>
                    {groups.map((group) => (
                        <button
                            key={group.code}
                            type="button"
                            className={`chip${group.code === groupCode ? ' is-active' : ''}`}
                            aria-pressed={group.code === groupCode}
                            disabled={group.count === 0 && group.code !== groupCode}
                            onClick={() => onGroupChange(group.code)}
                        >
                            {group.name}
                            <em className="chip__count">{group.count}</em>
                        </button>
                    ))}
                </div>

                <div className="list__tools">
                    <label className="blind" htmlFor="fcltKeyword">
                        시설명/코드 검색
                    </label>
                    <input
                        type="search"
                        id="fcltKeyword"
                        className="list__search"
                        placeholder="시설명/코드 검색"
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                    />
                    <button type="button" className="btn-excel" onClick={onExcel}>
                        엑셀저장
                    </button>
                </div>
            </div>

            {markerNote && <p className="list__note">{markerNote}</p>}

            <div className="tbl">
                <div className="tbl__head">
                    {COLUMNS.map((col) => (
                        <div key={col}>{col}</div>
                    ))}
                </div>

                <div ref={bodyRef} className="tbl__body scroll-area">
                    {rows.map((row) => {
                        const isDirty = dirtyCodes.has(row.code);
                        const isDuplicate = !!row.castName && duplicateNames.has(row.castName);

                        return (
                            <div key={row.code} className={`tbl__row${row.code === selectedCode ? ' is-selected' : ''}`} onClick={() => onSelect(row)}>
                                <div className="tbl__group">
                                    <i className={`dot dot--${row.fcltType.toLowerCase()}`} aria-hidden="true" />
                                    <span title={FCLT_TYPE_LABEL[row.fcltType]}>{row.groupName}</span>
                                </div>
                                <div className="tbl__code">{row.code}</div>
                                <div className="tbl__name" title={row.desc}>
                                    {row.name}
                                </div>

                                <div className={`tbl__cast${isDirty ? ' is-dirty' : ''}${isDuplicate ? ' is-duplicate' : ''}`}>
                                    <label className="blind" htmlFor={`cast-${row.code}`}>
                                        {row.name} CAST 시뮬레이션명
                                    </label>
                                    <input
                                        type="text"
                                        id={`cast-${row.code}`}
                                        className="cast-input"
                                        value={row.castName}
                                        placeholder="매핑 없음"
                                        maxLength={100}
                                        title={isDuplicate ? '다른 시설이 이미 쓰고 있는 이름입니다' : undefined}
                                        onChange={(e) => onCastChange(row.code, e.target.value)}
                                        onFocus={() => onSelect(row)}
                                    />
                                    {isDirty && (
                                        <span className="cast-flag" aria-label="저장 전">
                                            ●
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className={`state state--${row.status}`}>{MAPPING_STATUS_LABEL[row.status]}</span>
                                </div>
                            </div>
                        );
                    })}

                    {rows.length === 0 && <p className="tbl__empty">조건에 해당하는 시설이 없습니다.</p>}
                </div>
            </div>

            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={onPageChange} />
        </section>
    );
}

function Pagination({ page, totalPages, totalCount, onChange }: PaginationProps) {
    return (
        <nav className="list-pagination" aria-label="시설 목록 페이지">
            <span className="list-pagination__count">총 {formatCount(totalCount)}건</span>
            <button type="button" className="list-pagination__button" aria-label="이전 페이지" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                ‹
            </button>

            {toPageNumbers(page, totalPages).map((number) => (
                <button
                    key={number}
                    type="button"
                    className={`list-pagination__button${number === page ? ' is-current' : ''}`}
                    aria-current={number === page ? 'page' : undefined}
                    onClick={() => onChange(number)}
                >
                    {number}
                </button>
            ))}

            <button type="button" className="list-pagination__button" aria-label="다음 페이지" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
                ›
            </button>
        </nav>
    );
}
