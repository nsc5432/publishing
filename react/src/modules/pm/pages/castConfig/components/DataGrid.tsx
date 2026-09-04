import { useMemo } from 'react';
import { toCellKey } from '../cell';
import type { Dataset, DraftChanges, GridRow } from '../types';
import { readCellValue, toActiveShapeColumns, toShapeColumns } from '../view';
import { GridCellEditor } from './GridCellEditor';

interface DataGridProps {
    dataset: Dataset;
    rows: GridRow[];
    drafts: DraftChanges;
    readOnly: boolean;
    emptyMessage: string;
    onCellChange: (row: GridRow, column: string, value: string) => void;
}

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

export function DataGrid({ dataset, rows, drafts, readOnly, emptyMessage, onCellChange }: DataGridProps) {
    const spans = useMemo(() => toRowSpans(dataset, rows, drafts), [dataset, rows, drafts]);
    const shapeColumns = useMemo(() => toShapeColumns(dataset), [dataset]);

    if (rows.length === 0) {
        return (
            <div className="cast-config-empty-state">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <table className="cast-config-data-grid" aria-label={`${dataset.sheetName} 상세`}>
            <thead>
                <tr>
                    {dataset.columns.map((column) => (
                        <th key={column.key} scope="col" title={column.label}>
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => {
                    const activeShape = toActiveShapeColumns(dataset, row, drafts);

                    return (
                        <tr key={row.rowNo}>
                            {dataset.columns.map((column) => {
                                const key = toCellKey(dataset.sheetName, row.rowNo, column.key);
                                const span = spans.get(key) ?? 1;
                                if (span === 0) return null;
                                if (shapeColumns.has(column.key) && !activeShape.has(column.key)) {
                                    return (
                                        <td key={column.key} className="cast-config-cell-off">
                                            -
                                        </td>
                                    );
                                }

                                return (
                                    <td key={column.key} rowSpan={span > 1 ? span : undefined} className={drafts[key] !== undefined ? 'is-edited' : undefined}>
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
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
