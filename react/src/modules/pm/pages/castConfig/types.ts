import { TERMINAL_LABEL, TERMINALS, type TerminalKind } from '@/modules/pm/types/map.types';

export { TERMINAL_LABEL, TERMINALS };
export type { TerminalKind };

export type FacilityGroupId = 'checkin' | 'departure' | 'security' | 'border' | 'gate';

export type ColumnType = 'text' | 'number' | 'select' | 'time' | 'readonly';

export type ValidationKind = 'sum' | 'cumulative';

export interface GroupDefinition {
    id: FacilityGroupId;
    label: string;
    english: string;
    description: string;
}

export interface DatasetTab {
    sheetName: string;
    rowCount: number;
}

export interface FacilityGroup extends GroupDefinition {
    datasets: DatasetTab[];
}

export interface Category {
    code: string;
    name: string;
    isBase: boolean;
    confirmed: boolean;
    status: string;
    registeredAt: string;
}

export interface SelectOption {
    code: string;
    label: string;
    shapeColumns: string[];
}

export interface GridColumn {
    key: string;
    label: string;
    type: ColumnType;
    options: SelectOption[];
    merge: boolean;
}

export interface GridCell {
    value: string;
    formula: string;
    editable: boolean;
}

export interface GridRow {
    rowNo: number;
    cells: Record<string, GridCell>;
}

export interface Validation {
    kind: ValidationKind;
    column: string;
    groupColumn: string;
    target: number;
}

export interface Dataset {
    sheetName: string;
    dimension: string;
    columns: GridColumn[];
    rows: GridRow[];
    shapeColumn: string;
    validation: Validation | null;
}

export type DraftChanges = Record<string, string>;
