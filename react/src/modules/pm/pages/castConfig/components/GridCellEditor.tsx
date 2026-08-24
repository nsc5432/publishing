import type { GridCell, GridColumn } from '../types';

interface GridCellEditorProps {
    column: GridColumn;
    cell: GridCell | undefined;
    value: string;
    disabled: boolean;
    label: string;
    onChange: (value: string) => void;
}

export function GridCellEditor({ column, cell, value, disabled, label, onChange }: GridCellEditorProps) {
    if (disabled || column.type === 'readonly' || !cell?.editable) {
        return (
            <span
                className={`cast-config-cell-view${cell?.formula ? ' is-formula' : ''}`}
                title={cell?.formula ? `수식: ${cell.formula}` : undefined}
            >
                {column.type === 'time' && value ? `~ ${value}` : value}
            </span>
        );
    }

    if (column.type === 'select') {
        return (
            <select className="cast-config-cell-select" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
                {column.options.every((option) => option.code !== value) && <option value={value}>{value}</option>}
                {column.options.map((option) => (
                    <option key={option.code} value={option.code}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (column.type === 'number') {
        return (
            <input
                type="number"
                className="cast-config-cell-input is-number"
                value={value}
                aria-label={label}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (column.type === 'time') {
        return (
            <span className="cast-config-cell-time">
                ~
                <input
                    type="text"
                    className="cast-config-cell-input"
                    value={value}
                    placeholder="HH:mm:ss"
                    aria-label={label}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => onChange(event.target.value)}
                />
            </span>
        );
    }

    return (
        <textarea
            rows={1}
            className="cast-config-cell-input"
            value={value}
            aria-label={label}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}
