import { useMemo } from 'react';
import { CFMTN_COLUMN, USE_COLUMN, toCellKey } from '../cell';
import type { Dataset, DraftChanges, GridRow } from '../types';
import { CFMTN_OPTIONS, USE_OPTIONS, readCellValue, toActiveShapeColumns, toShapeColumns } from '../view';
import { GridCellEditor } from './GridCellEditor';

interface DataGridProps {
    dataset: Dataset;
    rows: GridRow[];
    drafts: DraftChanges;
    readOnly: boolean;
    selected: Set<number>;
    emptyMessage: string;
    onCellChange: (row: GridRow, column: string, value: string) => void;
    onToggleRow: (rowNo: number) => void;
    onToggleAll: (rowNos: number[], checked: boolean) => void;
}

/** 위 행과 값이 같으면 묶는다. 0 이면 그 칸은 그리지 않는다 */
function toRowSpans(dataset: Dataset, rows: GridRow[], drafts: DraftChanges): Map<string, number> {
    const spans = new Map<string, number>();

    for (const column of dataset.columns) {
        if (!column.merge) continue;

        let anchorKey = '';
        let anchorValue: string | null = null;

        for (const row of rows) {
            const key = toCellKey(dataset.sheetName, row.rowNo, column.key);
            const value = readCellValue(dataset.sheetName, row, column.key, drafts);

            if (anchorValue === value) {
                spans.set(key, 0);
                spans.set(anchorKey, (spans.get(anchorKey) ?? 1) + 1);
                continue;
            }

            anchorKey = key;
            anchorValue = value;
            spans.set(key, 1);
        }
    }

    return spans;
}

function toStatusValue(sheetName: string, row: GridRow, column: string, drafts: DraftChanges): string {
    const draft = drafts[toCellKey(sheetName, row.rowNo, column)];
    if (draft !== undefined) return draft;

    return (column === CFMTN_COLUMN ? row.confirmed : row.inUse) ? 'Y' : 'N';
}

export function DataGrid({
    dataset,
    rows,
    drafts,
    readOnly,
    selected,
    emptyMessage,
    onCellChange,
    onToggleRow,
    onToggleAll,
}: DataGridProps) {
    const spans = useMemo(() => toRowSpans(dataset, rows, drafts), [dataset, rows, drafts]);
    const shapeColumns = useMemo(() => toShapeColumns(dataset), [dataset]);

    if (rows.length === 0) {
        return (
            <div className="cast-config-empty-state">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    const pageRowNos = rows.map((row) => row.rowNo);
    const allSelected = pageRowNos.every((rowNo) => selected.has(rowNo));

    return (
        <table className="cast-config-data-grid" aria-label={`${dataset.sheetName} 상세`}>
            <thead>
                <tr>
                    {!readOnly && (
                        <th scope="col" className="cast-config-check-col">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                aria-label="이 페이지 전체 선택"
                                ref={(node) => {
                                    if (node) node.indeterminate = !allSelected && pageRowNos.some((rowNo) => selected.has(rowNo));
                                }}
                                onChange={(event) => onToggleAll(pageRowNos, event.target.checked)}
                            />
                        </th>
                    )}
                    {dataset.columns.map((column) => (
                        <th key={column.key} scope="col" title={column.label}>
                            {column.label}
                        </th>
                    ))}
                    <th scope="col">처리상태</th>
                    <th scope="col">확정여부</th>
                    <th scope="col">사용여부</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => {
                    const activeShape = toActiveShapeColumns(dataset, row, drafts);

                    return (
                        <tr key={row.rowNo} className={selected.has(row.rowNo) ? 'is-selected' : undefined}>
                            {!readOnly && (
                                <td className="cast-config-check-col">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(row.rowNo)}
                                        aria-label={`${row.rowNo}행 선택`}
                                        onChange={() => onToggleRow(row.rowNo)}
                                    />
                                </td>
                            )}

                            {dataset.columns.map((column) => {
                                const key = toCellKey(dataset.sheetName, row.rowNo, column.key);
                                const span = spans.get(key) ?? 1;
                                if (span === 0) return null;

                                // 분포 함수유형이 켜 주지 않은 값 칸은 이 행에서 쓰이지 않는다
                                if (shapeColumns.has(column.key) && !activeShape.has(column.key)) {
                                    return (
                                        <td key={column.key} className="cast-config-cell-off">
                                            -
                                        </td>
                                    );
                                }

                                return (
                                    <td
                                        key={column.key}
                                        rowSpan={span > 1 ? span : undefined}
                                        className={drafts[key] !== undefined ? 'is-edited' : undefined}
                                    >
                                        <GridCellEditor
                                            column={column}
                                            cell={row.cells[column.key]}
                                            value={readCellValue(dataset.sheetName, row, column.key, drafts)}
                                            disabled={readOnly}
                                            label={`${dataset.sheetName} ${row.rowNo}행 ${column.label}`}
                                            onChange={(value) => onCellChange(row, column.key, value)}
                                        />
                                    </td>
                                );
                            })}

                            <td>
                                <span className="cast-config-status-badge">{row.status}</span>
                            </td>

                            {[
                                { column: CFMTN_COLUMN, options: CFMTN_OPTIONS, label: '확정여부' },
                                { column: USE_COLUMN, options: USE_OPTIONS, label: '사용여부' },
                            ].map(({ column, options, label }) => {
                                const key = toCellKey(dataset.sheetName, row.rowNo, column);

                                return (
                                    <td key={column} className={drafts[key] !== undefined ? 'is-edited' : undefined}>
                                        <select
                                            className="cast-config-cell-select"
                                            value={toStatusValue(dataset.sheetName, row, column, drafts)}
                                            disabled={readOnly}
                                            aria-label={`${row.rowNo}행 ${label}`}
                                            onChange={(event) => onCellChange(row, column, event.target.value)}
                                        >
                                            {options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
