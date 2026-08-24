import { TERMINAL_LABEL, TERMINALS, type TerminalKind } from '@/modules/pm/types/map.types';

export { TERMINAL_LABEL, TERMINALS };
export type { TerminalKind };

export type FacilityGroupId = 'checkin' | 'departure' | 'security' | 'border' | 'gate';

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

export interface GridColumn {
    key: string;
    label: string;
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

export interface Dataset {
    sheetName: string;
    dimension: string;
    columns: GridColumn[];
    rows: GridRow[];
}

export type DraftChanges = Record<string, string>;
