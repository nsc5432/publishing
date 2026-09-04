import { pad2 } from './format';
import type { CastConfigSetDto } from '@/types/api.types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function toTimestamp(date: Date): string {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}

function toUniqueSheetName(name: string, usedNames: Set<string>): string {
    const normalized = name.replace(/[\\/*?:[\]]/g, '_').slice(0, 31) || '데이터';
    let candidate = normalized;
    let suffix = 2;

    while (usedNames.has(candidate)) {
        const marker = `_${suffix}`;
        candidate = `${normalized.slice(0, 31 - marker.length)}${marker}`;
        suffix += 1;
    }

    usedNames.add(candidate);
    return candidate;
}

export async function downloadCastConfigWorkbook(categoryName: string, dto: CastConfigSetDto): Promise<void> {
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    const usedNames = new Set<string>();
    const indexSheet = workbook.addWorksheet(toUniqueSheetName('목차', usedNames));

    indexSheet.addRow(['카테고리', categoryName]);
    indexSheet.addRow(['카테고리 코드', dto.fixAtrbGroupId]);
    indexSheet.addRow([]);
    indexSheet.addRow(['터미널', '시설그룹', '시트', '행수']);

    for (const item of dto.datasetList) {
        const terminal = item.tmnlId || '공통';
        const sheetName = toUniqueSheetName(`${terminal}_${item.groupNm}_${item.dataset.sheetNm}`, usedNames);
        const worksheet = workbook.addWorksheet(sheetName);
        const headers = item.dataset.columnList.map((column) => column.label || column.column);

        worksheet.addRow(headers);
        for (const row of item.dataset.rowList) {
            const cells = new Map(row.cellList.map((cell) => [cell.column, cell.value]));
            worksheet.addRow(item.dataset.columnList.map((column) => cells.get(column.column) ?? ''));
        }

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, headers.length) } };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26394D' } };
        worksheet.columns.forEach((column) => {
            column.width = 18;
        });

        indexSheet.addRow([terminal, item.groupNm, item.dataset.sheetNm, item.dataset.rowList.length]);
    }

    indexSheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    indexSheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26394D' } };
    indexSheet.columns.forEach((column) => {
        column.width = 24;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer as BlobPart], { type: XLSX_MIME }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cast설정_${dto.fixAtrbGroupId}_${toTimestamp(new Date())}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}
