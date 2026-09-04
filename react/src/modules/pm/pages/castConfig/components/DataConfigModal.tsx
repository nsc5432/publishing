import { useEffect, useMemo, useRef, useState } from 'react';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { dialog } from '@/lib/dialog';
import { toCellKey } from '../cell';
import type { Category, Dataset, DatasetScope, FacilityGroup, GridRow, TerminalKind } from '../types';
import { readCellValue, toShapeColumns } from '../view';
import { useCastConfigDataset } from '../hooks/useCastConfigDataset';
import type { DatasetDraft } from '../hooks/useDatasetDraft';
import { CumulativeChart } from './CumulativeChart';
import { DataGrid } from './DataGrid';
import { DatasetTabs } from './DatasetTabs';
import { GridToolbar } from './GridToolbar';
import { Pagination } from './Pagination';

interface DataConfigModalProps {
    terminal: TerminalKind;
    group: FacilityGroup;
    category: Category;
    draft: DatasetDraft;
    reloadToken: number;
    onClose: () => void;
}

const PAGE_SIZE = 25;

function toOriginalValue(row: GridRow, column: string): string {
    return row.cells[column]?.value ?? '';
}

function includesQuery(dataset: Dataset, row: GridRow, drafts: Record<string, string>, query: string): boolean {
    return dataset.columns.some((column) => readCellValue(dataset.sheetName, row, column.key, drafts).toLocaleLowerCase('ko-KR').includes(query));
}

export function DataConfigModal({ terminal, group, category, draft, reloadToken, onClose }: DataConfigModalProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [previewOpen, setPreviewOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const activeSheet = group.datasets[activeTab]?.sheetName ?? '';
    const scope = useMemo<DatasetScope>(() => ({ terminal, groupId: group.id, sheetName: activeSheet }), [activeSheet, group.id, terminal]);
    const datasetQuery = useMemo(
        () =>
            activeSheet
                ? {
                      terminal,
                      categoryCode: category.code,
                      groupId: group.id,
                      sheetName: activeSheet,
                      reloadToken,
                  }
                : null,
        [activeSheet, category.code, group.id, reloadToken, terminal],
    );
    const fetched = useCastConfigDataset(datasetQuery);
    const dataset = fetched.data;
    const drafts = draft.values(scope);
    const readOnly = category.isBase || category.isPreProcess;
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    const filteredRows = useMemo(
        () => (normalizedQuery ? dataset.rows.filter((row) => includesQuery(dataset, row, drafts, normalizedQuery)) : dataset.rows),
        [dataset, drafts, normalizedQuery],
    );
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const sheetChangeCount = Object.keys(drafts).length;

    useErrorAlert(fetched.error, fetched.token);

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
            onClose();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const handleTabSelect = (index: number) => {
        setActiveTab(index);
        setQuery('');
        setPage(1);
        gridRef.current?.scrollTo({ top: 0, left: 0 });
    };

    const handleCellChange = (row: GridRow, column: string, value: string) => {
        draft.setValue(scope, dataset, row.rowNo, column, value, toOriginalValue(row, column));
        if (column !== dataset.shapeColumn) return;

        const driver = dataset.columns.find((candidate) => candidate.key === column);
        const nextActive = new Set(driver?.options.find((option) => option.code === value)?.shapeColumns ?? []);
        const stale = [...toShapeColumns(dataset)].filter((shapeColumn) => !nextActive.has(shapeColumn));
        draft.removeKeys(
            scope,
            stale.map((shapeColumn) => toCellKey(dataset.sheetName, row.rowNo, shapeColumn)),
        );
    };

    const handleReset = () => {
        if (sheetChangeCount === 0) return;

        dialog
            .confirm({ title: '초기화', description: '이 시트의 편집 내용을 모두 버립니다. 계속하시겠습니까?' })
            .then((ok) => {
                if (ok) draft.clearSheet(scope);
            })
            .catch(() => {});
    };

    const emptyMessage = activeSheet
        ? normalizedQuery
            ? '검색 조건과 일치하는 행이 없습니다.'
            : '이 시설그룹과 연결된 원본 데이터가 없습니다.'
        : '연결된 원본 시트가 없습니다.';

    return (
        <div className="cast-config-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
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
                            {terminal} · {group.english} · {category.name}
                        </div>
                        <h2 id="cast-config-modal-title">{group.label}</h2>
                        <p id="cast-config-modal-subtitle">{group.description}</p>
                    </div>
                    <button ref={closeButtonRef} type="button" className="cast-config-icon-button" aria-label="레이어 닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <DatasetTabs tabs={group.datasets} activeIndex={activeTab} onSelect={handleTabSelect} />

                <GridToolbar
                    sheetName={dataset.sheetName || activeSheet}
                    query={query}
                    rowCount={filteredRows.length}
                    dimension={dataset.dimension}
                    sheetChangeCount={sheetChangeCount}
                    readOnly={readOnly}
                    isPreProcess={category.isPreProcess}
                    onQueryChange={(value) => {
                        setQuery(value);
                        setPage(1);
                    }}
                    onReset={handleReset}
                />

                {dataset.validation?.kind === 'cumulative' && (
                    <div className="cast-config-preview-wrap">
                        <button
                            type="button"
                            className="cast-config-preview-toggle"
                            aria-expanded={previewOpen}
                            onClick={() => setPreviewOpen((open) => !open)}
                        >
                            {previewOpen ? '접기' : '열기'} 누적곡선 미리보기
                        </button>
                        {previewOpen && <CumulativeChart dataset={dataset} rule={dataset.validation} drafts={drafts} />}
                    </div>
                )}

                <div ref={gridRef} className="cast-config-grid-container" role="tabpanel" id="cast-config-grid-panel">
                    <DataGrid
                        dataset={dataset}
                        rows={pageRows}
                        drafts={drafts}
                        readOnly={readOnly}
                        emptyMessage={emptyMessage}
                        onCellChange={handleCellChange}
                    />
                </div>

                <footer className="cast-config-modal__footer">
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onChange={(next) => {
                            setPage(next);
                            gridRef.current?.scrollTo({ top: 0 });
                        }}
                    />
                    <button type="button" className="cast-config-ghost-button" onClick={onClose}>
                        닫기
                    </button>
                </footer>
            </section>
        </div>
    );
}
