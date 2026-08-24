import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { dialog } from '@/lib/dialog';
import type { ApiError, CastConfigSaveItemDto } from '@/types/api.types';
import { toCellKey } from '../cell';
import type { DraftChanges, FacilityGroup, GridRow, TerminalKind } from '../types';
import { EMPTY_CAST_CONFIG_DATASET } from '../view';
import { useCastConfigDataset } from '../hooks/useCastConfigDataset';
import { DataGrid } from './DataGrid';
import { DatasetTabs } from './DatasetTabs';
import { GridToolbar } from './GridToolbar';

interface DataConfigModalProps {
    terminal: TerminalKind;
    group: FacilityGroup;
    onClose: () => void;
}

const PAGE_SIZE = 25;
const SAVE_FAIL = '변경사항을 저장하지 못했습니다.';
const CLOSE_WARNING = '저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?';

function toSaveItems(drafts: DraftChanges): CastConfigSaveItemDto[] {
    return Object.entries(drafts).map(([key, value]) => {
        const [sheetNm, rowNo, column] = key.split('::');
        return { sheetNm, rowNo: Number(rowNo), column, value };
    });
}

function includesQuery(row: GridRow, sheetName: string, drafts: DraftChanges, query: string): boolean {
    return Object.entries(row.cells).some(([column, cell]) => {
        const key = toCellKey(sheetName, row.rowNo, column);
        return (drafts[key] ?? cell.value).toLocaleLowerCase('ko-KR').includes(query);
    });
}

export function DataConfigModal({ terminal, group, onClose }: DataConfigModalProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [drafts, setDrafts] = useState<DraftChanges>({});
    const [saving, setSaving] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const activeSheet = group.datasets[activeTab]?.sheetName ?? '';

    const datasetQuery = useMemo(() => (activeSheet ? { terminal, groupId: group.id, sheetName: activeSheet } : null), [activeSheet, group.id, terminal]);
    const fetched = useCastConfigDataset(datasetQuery);
    const dataset = fetched.data ?? EMPTY_CAST_CONFIG_DATASET;
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    const filteredRows = useMemo(
        () => (normalizedQuery ? dataset.rows.filter((row) => includesQuery(row, dataset.sheetName, drafts, normalizedQuery)) : dataset.rows),
        [dataset, drafts, normalizedQuery],
    );
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const changeCount = Object.keys(drafts).length;

    useErrorAlert(fetched.error, fetched.token);

    const requestClose = useCallback(() => {
        if (changeCount === 0) {
            onClose();
            return;
        }

        dialog
            .confirm({ title: 'Cast 설정', description: CLOSE_WARNING })
            .then((ok) => {
                if (ok) onClose();
            })
            .catch(() => {});
    }, [changeCount, onClose]);

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || document.querySelector('[role="alertdialog"]')) return;
            event.preventDefault();
            requestClose();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [requestClose]);

    const handleTabSelect = (index: number) => {
        setActiveTab(index);
        setQuery('');
        setPage(1);
        gridRef.current?.scrollTo({ top: 0, left: 0 });
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    const handleCellChange = (row: GridRow, column: string, value: string) => {
        const key = toCellKey(dataset.sheetName, row.rowNo, column);
        const original = row.cells[column]?.value ?? '';

        setDrafts((previous) => {
            if (value !== original) return { ...previous, [key]: value };
            if (previous[key] === undefined) return previous;

            const next = { ...previous };
            delete next[key];
            return next;
        });
    };

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        gridRef.current?.scrollTo({ top: 0 });
    };

    const handleSave = () => {
        const itemList = toSaveItems(drafts);
        if (itemList.length === 0 || saving) return;

        setSaving(true);
        castConfigService
            .saveDataset(terminal, itemList)
            .then((dto) => unwrap(dto, SAVE_FAIL))
            .then(() => {
                setSaving(false);
                setDrafts({});
                onClose();
                dialog
                    .alert({
                        title: '저장 완료',
                        description: `${itemList.length.toLocaleString('ko-KR')}개 변경사항을 저장했습니다.`,
                    })
                    .catch(() => {});
            })
            .catch((error: ApiError) => {
                setSaving(false);
                dialog.alert({ title: '저장 실패', description: error?.message || SAVE_FAIL }).catch(() => {});
            });
    };

    const emptyMessage = activeSheet
        ? normalizedQuery
            ? '검색 조건과 일치하는 행이 없습니다.'
            : '이 시설그룹과 연결된 원본 데이터가 없습니다.'
        : '연결된 원본 시트가 없습니다.';

    return (
        <div
            className="cast-config-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) requestClose();
            }}
        >
            <section
                className="cast-config-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cast-config-modal-title"
                aria-describedby="cast-config-modal-subtitle"
            >
                <header className="cast-config-modal__header">
                    <div>
                        <div className="cast-config-modal__kicker">
                            {terminal} · {group.english}
                        </div>
                        <h2 id="cast-config-modal-title">{group.label}</h2>
                        <p id="cast-config-modal-subtitle">{group.description}</p>
                    </div>
                    <button ref={closeButtonRef} type="button" className="cast-config-icon-button" aria-label="레이어 닫기" onClick={requestClose}>
                        ×
                    </button>
                </header>

                <DatasetTabs tabs={group.datasets} activeIndex={activeTab} onSelect={handleTabSelect} />
                <GridToolbar
                    query={query}
                    rowCount={filteredRows.length}
                    dimension={dataset.dimension}
                    changeCount={changeCount}
                    onQueryChange={handleQueryChange}
                />

                <div ref={gridRef} className="cast-config-grid-container">
                    <DataGrid dataset={dataset} rows={pageRows} drafts={drafts} emptyMessage={emptyMessage} onCellChange={handleCellChange} />
                </div>

                <footer className="cast-config-modal__footer">
                    <div className="cast-config-pagination">
                        <button
                            type="button"
                            className="cast-config-page-button"
                            aria-label="이전 페이지"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            ‹
                        </button>
                        <span>
                            {filteredRows.length === 0 ? 0 : currentPage.toLocaleString('ko-KR')} /{' '}
                            {filteredRows.length === 0 ? 0 : totalPages.toLocaleString('ko-KR')}
                        </span>
                        <button
                            type="button"
                            className="cast-config-page-button"
                            aria-label="다음 페이지"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            ›
                        </button>
                    </div>
                    <button type="button" className="cast-config-ghost-button" onClick={requestClose}>
                        취소
                    </button>
                    <button type="button" className="cast-config-primary-button" disabled={changeCount === 0 || saving} onClick={handleSave}>
                        {saving ? '저장 중' : '변경사항 저장'}
                    </button>
                </footer>
            </section>
        </div>
    );
}
