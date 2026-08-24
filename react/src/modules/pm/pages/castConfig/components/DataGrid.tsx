import type { Dataset, DraftChanges, GridCell, GridRow } from '../types';
import { toCellKey } from '../cell';

interface DataGridProps {
    dataset: Dataset;
    rows: GridRow[];
    drafts: DraftChanges;
    emptyMessage: string;
    onCellChange: (row: GridRow, column: string, value: string) => void;
}

function toDisplayValue(sheetName: string, row: GridRow, column: string, cell: GridCell | undefined, drafts: DraftChanges): string {
    return drafts[toCellKey(sheetName, row.rowNo, column)] ?? cell?.value ?? '';
}

export function DataGrid({ dataset, rows, drafts, emptyMessage, onCellChange }: DataGridProps) {
    if (rows.length === 0) {
        return (
            <div className="cast-config-empty-state">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <table className="cast-config-data-grid" aria-label={`${dataset.sheetName} 원본 데이터`}>
            <thead>
                <tr>
                    <th scope="col">행</th>
                    {dataset.columns.map((column) => (
                        <th key={column.key} scope="col" title={column.label}>
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.rowNo}>
                        <td>{row.rowNo}</td>
                        {dataset.columns.map((column) => {
                            const cell = row.cells[column.key];
                            const key = toCellKey(dataset.sheetName, row.rowNo, column.key);
                            const value = toDisplayValue(dataset.sheetName, row, column.key, cell, drafts);
                            const edited = drafts[key] !== undefined;

                            return (
                                <td key={column.key} className={edited ? 'is-edited' : undefined}>
                                    {cell?.editable ? (
                                        <textarea
                                            rows={1}
                                            className="cast-config-cell-input"
                                            value={value}
                                            aria-label={`${dataset.sheetName} ${column.key}${row.rowNo} 편집`}
                                            onFocus={(event) => event.currentTarget.select()}
                                            onChange={(event) => onCellChange(row, column.key, event.target.value)}
                                        />
                                    ) : (
                                        <span
                                            className={`cast-config-cell-view${cell?.formula ? ' is-formula' : ''}`}
                                            title={cell?.formula ? `수식: ${cell.formula}` : undefined}
                                        >
                                            {value}
                                        </span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
