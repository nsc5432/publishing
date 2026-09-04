export function toCellKey(sheetName: string, rowNo: number, column: string): string {
    return `${sheetName}::${rowNo}::${column}`;
}

export function toDatasetScopeKey(terminal: string, groupId: string, sheetName: string): string {
    return `${terminal}::${groupId}::${sheetName}`;
}

export function toDatasetDraftKey(terminal: string, groupId: string, sheetName: string, rowNo: number, column: string): string {
    return `${toDatasetScopeKey(terminal, groupId, sheetName)}::${rowNo}::${column}`;
}
