/** 행 상태는 셀이 아니지만 draft·저장 경로를 하나로 두려고 예약 컬럼명을 쓴다 */
export const CFMTN_COLUMN = '__cfmtnYn';
export const USE_COLUMN = '__useYn';

export function toCellKey(sheetName: string, rowNo: number, column: string): string {
    return `${sheetName}::${rowNo}::${column}`;
}
