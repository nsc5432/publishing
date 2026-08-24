/** CSV 한 칸 — 쉼표·따옴표·줄바꿈이 섞여도 열이 밀리지 않게 감싼다 */
function toCsvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

/**
 * 지금 보고 있는 목록을 그대로 파일로 내린다.
 *
 * 앞에 BOM 을 붙인다 — 없으면 엑셀이 UTF-8 로 읽지 않아 한글이 깨진다.
 */
export function downloadCsv(fileName: string, header: string[], rows: string[][]): void {
    const lines = [header, ...rows].map((cells) => cells.map(toCsvCell).join(','));
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
}
