import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { downloadCsv } from '@/lib/csv';
import { dialog } from '@/lib/dialog';
import { formatCount } from '@/lib/format';
import type { ApiError, CastConfigCategorySaveDto, CastConfigSaveItemDto } from '@/types/api.types';
import { toCellKey } from '../cell';
import type { Category, Dataset, DraftChanges, FacilityGroup, GridRow, TerminalKind } from '../types';
import { readCellValue, toShapeColumns, validateDataset } from '../view';
import { useCastConfigApplyHistory } from '../hooks/useCastConfigApplyHistory';
import { useCastConfigCategories } from '../hooks/useCastConfigCategories';
import { useCastConfigDataset } from '../hooks/useCastConfigDataset';
import { useCastConfigPreProcessDiff } from '../hooks/useCastConfigPreProcessDiff';
import { useDatasetDraft } from '../hooks/useDatasetDraft';
import { CategoryBar } from './CategoryBar';
import { CategoryManagerModal } from './CategoryManagerModal';
import { CategoryRegisterModal } from './CategoryRegisterModal';
import { CumulativeChart } from './CumulativeChart';
import { DataGrid } from './DataGrid';
import { DatasetTabs } from './DatasetTabs';
import { GridToolbar } from './GridToolbar';
import { Pagination } from './Pagination';
import { PreProcessApplyModal } from './PreProcessApplyModal';
import { PreProcessHistoryModal } from './PreProcessHistoryModal';

interface DataConfigModalProps {
    terminal: TerminalKind;
    group: FacilityGroup;
    onClose: () => void;
}

type Layer = 'none' | 'register' | 'manage' | 'preProcess' | 'history';

const PAGE_SIZE = 25;
const SAVE_FAIL = '변경사항을 저장하지 못했습니다.';
const DISCARD_WARNING = '저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?';

function toSaveItems(categoryCode: string, drafts: DraftChanges): CastConfigSaveItemDto[] {
    return Object.entries(drafts).map(([key, value]) => {
        const [sheetNm, rowNo, column] = key.split('::');
        return { fixAtrbGroupId: categoryCode, sheetNm, rowNo: Number(rowNo), column, value };
    });
}

function toOriginalValue(row: GridRow, column: string): string {
    return row.cells[column]?.value ?? '';
}

function includesQuery(dataset: Dataset, row: GridRow, drafts: DraftChanges, query: string): boolean {
    return dataset.columns.some((column) => readCellValue(dataset.sheetName, row, column.key, drafts).toLocaleLowerCase('ko-KR').includes(query));
}

export function DataConfigModal({ terminal, group, onClose }: DataConfigModalProps) {
    const [categoryCode, setCategoryCode] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [layer, setLayer] = useState<Layer>('none');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const draft = useDatasetDraft();
    const { drafts } = draft;

    const categoryQuery = useMemo(() => ({ terminal }), [terminal]);
    const fetchedCategories = useCastConfigCategories(categoryQuery);
    const categories = fetchedCategories.data;
    const currentCategory: Category | null = categories.find((category) => category.code === categoryCode) ?? categories[0] ?? null;
    const isBase = currentCategory?.isBase ?? false;
    const isPreProcess = currentCategory?.isPreProcess ?? false;
    const readOnly = isBase || isPreProcess || currentCategory === null;

    const activeSheet = group.datasets[activeTab]?.sheetName ?? '';
    const datasetQuery = useMemo(
        () =>
            activeSheet && currentCategory
                ? {
                      terminal,
                      categoryCode: currentCategory.code,
                      groupId: group.id,
                      sheetName: activeSheet,
                      reloadToken,
                  }
                : null,
        [activeSheet, currentCategory, group.id, reloadToken, terminal],
    );
    const fetched = useCastConfigDataset(datasetQuery);
    const dataset = fetched.data;

    const diffQuery = useMemo(
        () => (layer === 'preProcess' && activeSheet && isBase ? { terminal, groupId: group.id, sheetName: activeSheet, reloadToken } : null),
        [activeSheet, group.id, isBase, layer, reloadToken, terminal],
    );
    const fetchedDiff = useCastConfigPreProcessDiff(diffQuery);

    const historyQuery = useMemo(
        () => (layer === 'history' && isBase ? { terminal, sheetName: activeSheet, reloadToken } : null),
        [activeSheet, isBase, layer, reloadToken, terminal],
    );
    const fetchedHistory = useCastConfigApplyHistory(historyQuery);

    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    const filteredRows = useMemo(
        () => (normalizedQuery ? dataset.rows.filter((row) => includesQuery(dataset, row, drafts, normalizedQuery)) : dataset.rows),
        [dataset, drafts, normalizedQuery],
    );
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const totalChangeCount = Object.keys(drafts).length;
    const sheetChangeCount = Object.keys(drafts).filter((key) => key.startsWith(`${activeSheet}::`)).length;

    useErrorAlert(fetchedCategories.error, fetchedCategories.token);
    useErrorAlert(fetched.error, fetched.token);
    useErrorAlert(fetchedDiff.error, fetchedDiff.token);
    useErrorAlert(fetchedHistory.error, fetchedHistory.token);

    const confirmDiscard = useCallback(async () => {
        if (totalChangeCount === 0) return true;

        return dialog.confirm({ title: 'Cast 설정', description: DISCARD_WARNING }).catch(() => false);
    }, [totalChangeCount]);

    const requestClose = useCallback(() => {
        confirmDiscard()
            .then((ok) => {
                if (ok) onClose();
            })
            .catch(() => {});
    }, [confirmDiscard, onClose]);

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
            if (layer !== 'none') setLayer('none');
            else requestClose();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [layer, requestClose]);

    const handleTabSelect = (index: number) => {
        setActiveTab(index);
        setQuery('');
        setPage(1);
        draft.clearSelection();
        gridRef.current?.scrollTo({ top: 0, left: 0 });
    };

    const handleCategorySelect = (code: string) => {
        if (code === currentCategory?.code) return;

        confirmDiscard()
            .then((ok) => {
                if (!ok) return;

                draft.clearAll();
                draft.clearSelection();
                setCategoryCode(code);
                setPage(1);
                setLayer('none');
            })
            .catch(() => {});
    };

    const handleCellChange = (row: GridRow, column: string, value: string) => {
        draft.setValue(toCellKey(dataset.sheetName, row.rowNo, column), value, toOriginalValue(row, column));

        if (column !== dataset.shapeColumn) return;

        const driver = dataset.columns.find((candidate) => candidate.key === column);
        const nextActive = new Set(driver?.options.find((option) => option.code === value)?.shapeColumns ?? []);
        const stale = [...toShapeColumns(dataset)].filter((shapeColumn) => !nextActive.has(shapeColumn));

        draft.removeKeys(stale.map((shapeColumn) => toCellKey(dataset.sheetName, row.rowNo, shapeColumn)));
    };

    const handleDownload = () => {
        if (filteredRows.length === 0) {
            dialog.alert({ title: '엑셀저장', description: '저장할 행이 없습니다.' }).catch(() => {});
            return;
        }

        downloadCsv(
            `${dataset.sheetName}_${terminal}_${currentCategory?.code ?? ''}.csv`,
            dataset.columns.map((column) => column.label),
            filteredRows.map((row) => dataset.columns.map((column) => readCellValue(dataset.sheetName, row, column.key, drafts))),
        );
    };

    const runAndReload = (title: string, run: () => Promise<unknown>) => {
        setSaving(true);
        run()
            .then(() => {
                setSaving(false);
                draft.clearSheet(dataset.sheetName);
                draft.clearSelection();
                setReloadToken((token) => token + 1);
            })
            .catch((error: ApiError) => {
                setSaving(false);
                dialog.alert({ title, description: error?.message || '요청을 처리하지 못했습니다.' }).catch(() => {});
            });
    };

    const handleUpload = (file: File) => {
        if (!currentCategory) return;

        runAndReload('엑셀업로드', () =>
            castConfigService
                .uploadExcel(terminal, group.id, currentCategory.code, dataset.sheetName, file)
                .then((dto) => unwrap(dto, '엑셀을 반영하지 못했습니다.')),
        );
    };

    const handleApplyDefault = () => {
        if (!currentCategory) return;

        const rowNoList = [...draft.selected];
        const scope = rowNoList.length > 0 ? `선택한 ${formatCount(rowNoList.length)}개 행` : '이 시트 전체';

        dialog
            .confirm({ title: '디폴트속성적용', description: `${scope}을 기준정보 값으로 되돌립니다. 계속하시겠습니까?` })
            .then((ok) => {
                if (!ok) return;

                runAndReload('디폴트속성적용', () =>
                    castConfigService
                        .applyDefault(terminal, group.id, currentCategory.code, dataset.sheetName, rowNoList)
                        .then((dto) => unwrap(dto, '기준정보를 적용하지 못했습니다.')),
                );
            })
            .catch(() => {});
    };

    const handleApplyPreProcess = (rowNoList: number[]) => {
        const diff = fetchedDiff.data;
        const preview: DraftChanges = {};
        for (const row of diff.rows) {
            if (!rowNoList.includes(row.rowNo)) continue;

            diff.valueLabels.forEach((label, index) => {
                preview[toCellKey(dataset.sheetName, row.rowNo, label)] = row.preValues[index] ?? '';
            });
        }

        const messages = validateDataset(dataset, preview);
        if (messages.length > 0) {
            dialog.alert({ title: '반영 전 확인', description: messages.join('\n') }).catch(() => {});
            return;
        }

        dialog
            .confirm({
                title: '전처리 반영',
                description: `선택한 ${formatCount(rowNoList.length)}개 행을 기준정보에 반영합니다. 일일 시뮬레이션에 그대로 쓰입니다. 계속하시겠습니까?`,
            })
            .then((ok) => {
                if (!ok) return;

                setSaving(true);
                castConfigService
                    .applyPreProcess(terminal, group.id, dataset.sheetName, diff.preProcessDt, rowNoList)
                    .then((dto) => unwrap(dto, '전처리 결과를 반영하지 못했습니다.'))
                    .then(() => {
                        setSaving(false);
                        setLayer('none');
                        setReloadToken((token) => token + 1);
                        dialog.alert({ title: '반영 완료', description: `${formatCount(rowNoList.length)}개 행을 기준정보에 반영했습니다.` }).catch(() => {});
                    })
                    .catch((error: ApiError) => {
                        setSaving(false);
                        dialog.alert({ title: '전처리 반영', description: error?.message || '전처리 결과를 반영하지 못했습니다.' }).catch(() => {});
                    });
            })
            .catch(() => {});
    };

    const handleRevertPreProcess = (aplySn: number) => {
        dialog
            .confirm({ title: '되돌리기', description: '이 반영을 되돌려 직전 값으로 복원합니다. 계속하시겠습니까?' })
            .then((ok) => {
                if (!ok) return;

                setSaving(true);
                castConfigService
                    .revertPreProcess(aplySn)
                    .then((dto) => unwrap(dto, '반영을 되돌리지 못했습니다.'))
                    .then(() => {
                        setSaving(false);
                        setReloadToken((token) => token + 1);
                    })
                    .catch((error: ApiError) => {
                        setSaving(false);
                        dialog.alert({ title: '되돌리기', description: error?.message || '반영을 되돌리지 못했습니다.' }).catch(() => {});
                    });
            })
            .catch(() => {});
    };

    const handleReset = () => {
        if (sheetChangeCount === 0) return;

        dialog
            .confirm({ title: '초기화', description: '이 시트의 편집 내용을 모두 버립니다. 계속하시겠습니까?' })
            .then((ok) => {
                if (!ok) return;

                draft.clearSheet(dataset.sheetName);
                draft.clearSelection();
                setReloadToken((token) => token + 1);
            })
            .catch(() => {});
    };

    const handleCategorySave = (dto: CastConfigCategorySaveDto) => {
        setSaving(true);
        castConfigService
            .saveCategory(terminal, dto)
            .then((response) => unwrap(response, '카테고리를 등록하지 못했습니다.'))
            .then(() => {
                setSaving(false);
                setLayer('none');
                draft.clearAll();
                draft.clearSelection();
                setCategoryCode(dto.fixAtrbGroupId);
                setReloadToken((token) => token + 1);
            })
            .catch((error: ApiError) => {
                setSaving(false);
                dialog.alert({ title: '카테고리 등록', description: error?.message || '카테고리를 등록하지 못했습니다.' }).catch(() => {});
            });
    };

    const handleSave = () => {
        if (totalChangeCount === 0 || saving || !currentCategory) return;

        const messages = validateDataset(dataset, drafts);
        if (messages.length > 0) {
            dialog.alert({ title: '저장 전 확인', description: messages.join('\n') }).catch(() => {});
            return;
        }

        const itemList = toSaveItems(currentCategory.code, drafts);
        setSaving(true);
        castConfigService
            .saveDataset(terminal, group.id, itemList)
            .then((dto) => unwrap(dto, SAVE_FAIL))
            .then(() => {
                setSaving(false);
                draft.clearAll();
                draft.clearSelection();
                setReloadToken((token) => token + 1);
                dialog.alert({ title: '저장 완료', description: `${formatCount(itemList.length)}개 변경사항을 저장했습니다.` }).catch(() => {});
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

                <CategoryBar
                    categories={categories}
                    current={currentCategory}
                    onSelect={handleCategorySelect}
                    onRegister={() => setLayer('register')}
                    onManage={() => setLayer('manage')}
                />

                <DatasetTabs tabs={group.datasets} activeIndex={activeTab} onSelect={handleTabSelect} />

                <GridToolbar
                    sheetName={dataset.sheetName || activeSheet}
                    query={query}
                    rowCount={filteredRows.length}
                    dimension={dataset.dimension}
                    sheetChangeCount={sheetChangeCount}
                    totalChangeCount={totalChangeCount}
                    readOnly={readOnly}
                    isBase={isBase}
                    isPreProcess={isPreProcess}
                    onQueryChange={(value) => {
                        setQuery(value);
                        setPage(1);
                    }}
                    onDownload={handleDownload}
                    onUpload={handleUpload}
                    onApplyDefault={handleApplyDefault}
                    onApplyPreProcess={() => setLayer('preProcess')}
                    onOpenHistory={() => setLayer('history')}
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
                            {previewOpen ? '▾' : '▸'} 누적곡선 미리보기
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
                        selected={draft.selected}
                        emptyMessage={emptyMessage}
                        onCellChange={handleCellChange}
                        onToggleRow={draft.toggleRow}
                        onToggleAll={draft.toggleAll}
                    />
                </div>

                {!readOnly && draft.selected.size > 0 && (
                    <div className="cast-config-bulk-bar">
                        <span>{formatCount(draft.selected.size)}행 선택</span>
                        <button type="button" className="cast-config-ghost-button" onClick={draft.clearSelection}>
                            선택 해제
                        </button>
                    </div>
                )}

                <footer className="cast-config-modal__footer">
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onChange={(next) => {
                            setPage(next);
                            gridRef.current?.scrollTo({ top: 0 });
                        }}
                    />
                    <button type="button" className="cast-config-ghost-button" onClick={requestClose}>
                        취소
                    </button>
                    <button type="button" className="cast-config-primary-button" disabled={totalChangeCount === 0 || saving || readOnly} onClick={handleSave}>
                        {saving ? '저장 중' : '저장'}
                    </button>
                </footer>
            </section>

            {layer === 'register' && (
                <CategoryRegisterModal
                    sheetNames={group.datasets.map((tab) => tab.sheetName)}
                    saving={saving}
                    onSubmit={handleCategorySave}
                    onClose={() => setLayer('none')}
                />
            )}

            {layer === 'manage' && (
                <CategoryManagerModal
                    categories={categories}
                    currentCode={currentCategory?.code ?? ''}
                    onSelect={handleCategorySelect}
                    onClose={() => setLayer('none')}
                />
            )}

            {layer === 'preProcess' && (
                <PreProcessApplyModal
                    key={`${dataset.sheetName}-${fetchedDiff.token}`}
                    diff={fetchedDiff.data}
                    applying={saving}
                    onApply={handleApplyPreProcess}
                    onClose={() => setLayer('none')}
                />
            )}

            {layer === 'history' && (
                <PreProcessHistoryModal
                    histories={fetchedHistory.data}
                    reverting={saving}
                    onRevert={handleRevertPreProcess}
                    onClose={() => setLayer('none')}
                />
            )}
        </div>
    );
}
