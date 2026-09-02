import { formatCount, formatDateTime } from '@/lib/format';
import type {
    CastConfigAplyHstryListDto,
    CastConfigCategoryDto,
    CastConfigCategoryListDto,
    CastConfigColumnType,
    CastConfigDatasetDto,
    CastConfigGroupDto,
    CastConfigGroupListDto,
    CastConfigPreProcessDiffDto,
    CastConfigValidationKind,
} from '@/types/api.types';
import { toCellKey } from './cell';
import type {
    ApplyHistory,
    Category,
    ColumnType,
    Dataset,
    DraftChanges,
    FacilityGroup,
    FacilityGroupId,
    GridRow,
    GroupDefinition,
    PreProcessDiff,
    ValidationKind,
} from './types';

const GROUP_IDS: FacilityGroupId[] = ['checkin', 'departure', 'security', 'border', 'gate'];

const GROUP_FALLBACKS: Record<FacilityGroupId, GroupDefinition> = {
    checkin: {
        id: 'checkin',
        label: '체크인 영역',
        english: 'Check-in Facility Group',
        description: '체크인 방식, 서비스타임, 카운터 및 셀프서비스 시설코드',
    },
    departure: {
        id: 'departure',
        label: '출국장 영역',
        english: 'Departure Hall Facility Group',
        description: '출국장 운영시간과 여객 발생·이동·리포팅 속성',
    },
    security: {
        id: 'security',
        label: '시큐리티 영역',
        english: 'Security Facility Group',
        description: '탑승권·보안검색 서비스타임, 운영시간 및 레인 수',
    },
    border: {
        id: 'border',
        label: '출입국심사 영역',
        english: 'Border Control Facility Group',
        description: '출입국·검역 서비스타임, 운영시간, 레인 및 여객 속성',
    },
    gate: {
        id: 'gate',
        label: '게이트 영역',
        english: 'Gate Facility Group',
        description: '게이트, 검역, 시설물 속성 및 게이트 리포팅 데이터',
    },
};

const COLUMN_TYPE: Record<CastConfigColumnType, ColumnType> = {
    TEXT: 'text',
    NUMBER: 'number',
    SELECT: 'select',
    TIME: 'time',
    READONLY: 'readonly',
};

const VALIDATION_KIND: Record<CastConfigValidationKind, ValidationKind> = {
    SUM: 'sum',
    CUMULATIVE: 'cumulative',
};

export const PRCS_STTS_LABEL: Record<string, string> = {
    '01': '등록',
    '02': '검토',
    '03': '반려',
};

function isFacilityGroupId(value: string): value is FacilityGroupId {
    return GROUP_IDS.some((id) => id === value);
}

function toFacilityGroup(dto: CastConfigGroupDto): FacilityGroup | null {
    if (!isFacilityGroupId(dto.groupId)) return null;

    const fallback = GROUP_FALLBACKS[dto.groupId];
    return {
        id: dto.groupId,
        label: dto.groupNm || fallback.label,
        english: dto.groupNmEn || fallback.english,
        description: dto.groupDesc || fallback.description,
        datasets: dto.datasetList.map((dataset) => ({
            sheetName: dataset.sheetNm,
            rowCount: dataset.rowCnt,
        })),
    };
}

export function toCastConfigGroups(dto: CastConfigGroupListDto): FacilityGroup[] {
    const groups = dto.groupList.map(toFacilityGroup).filter((group): group is FacilityGroup => group !== null);

    return GROUP_IDS.map((id) => groups.find((group) => group.id === id) ?? { ...GROUP_FALLBACKS[id], datasets: [] });
}

function toCategory(dto: CastConfigCategoryDto): Category {
    return {
        code: dto.fixAtrbGroupId,
        name: dto.atrbGroupNm,
        isBase: dto.baseYn === 'Y',
        isPreProcess: dto.prePrcsYn === 'Y',
        confirmed: dto.cfmtnYn === 'Y',
        status: PRCS_STTS_LABEL[dto.groupPrcsSttsCd] ?? dto.groupPrcsSttsCd,
        registeredAt: formatDateTime(dto.frstRegDt),
        modifiedAt: formatDateTime(dto.lastMdfcnDt),
    };
}

export function toCastConfigCategories(dto: CastConfigCategoryListDto): Category[] {
    return dto.categoryList.map(toCategory);
}

export function toPreProcessDiff(dto: CastConfigPreProcessDiffDto): PreProcessDiff {
    return {
        sheetName: dto.sheetNm,
        valueLabel: dto.valueLabel,
        changedCount: dto.changedCnt,
        rows: dto.rowList.map((row) => ({
            rowNo: row.rowNo,
            attribute: row.atrbCdNm || row.atrbCd,
            detail: row.dtlSeCdNm || row.dtlSeCd,
            baseValue: row.baseVl,
            preValue: row.preVl,
            changed: row.changedYn === 'Y',
            matched: row.matchedYn === 'Y',
        })),
        preProcessName: dto.preProcessNm,
        preProcessAt: formatDateTime(dto.preProcessDt),
        preProcessDt: dto.preProcessDt,
    };
}

export function toApplyHistories(dto: CastConfigAplyHstryListDto): ApplyHistory[] {
    return dto.hstryList.map((hstry) => ({
        sn: hstry.aplySn,
        sheetName: hstry.sheetNm,
        rowCount: hstry.aplyRowCnt,
        canceled: hstry.cnclYn === 'Y',
        revertable: hstry.revertableYn === 'Y',
        appliedAt: formatDateTime(hstry.frstRegDt),
        appliedBy: hstry.frstRgtrId,
    }));
}

export function toCastConfigDataset(dto: CastConfigDatasetDto): Dataset {
    return {
        sheetName: dto.sheetNm,
        dimension: dto.dimension,
        columns: dto.columnList.map((column) => ({
            key: column.column,
            label: column.label || column.column,
            type: COLUMN_TYPE[column.type] ?? 'text',
            options: column.optionList.map((option) => ({
                code: option.code,
                label: option.label,
                shapeColumns: option.shapeColumnList,
            })),
            merge: column.mergeYn === 'Y',
        })),
        rows: dto.rowList.map((row) => ({
            rowNo: row.rowNo,
            cells: Object.fromEntries(
                row.cellList.map((cell) => [
                    cell.column,
                    {
                        value: cell.value,
                        formula: cell.formula,
                        editable: cell.editableYn === 'Y',
                    },
                ]),
            ),
        })),
        shapeColumn: dto.shapeColumn,
        validation: dto.validation
            ? {
                  kind: VALIDATION_KIND[dto.validation.kind],
                  column: dto.validation.column,
                  groupColumn: dto.validation.groupColumn,
                  target: dto.validation.target,
              }
            : null,
    };
}

export function readCellValue(sheetName: string, row: GridRow, column: string, drafts: DraftChanges): string {
    return drafts[toCellKey(sheetName, row.rowNo, column)] ?? row.cells[column]?.value ?? '';
}

export function toShapeColumns(dataset: Dataset): Set<string> {
    const driver = dataset.columns.find((column) => column.key === dataset.shapeColumn);
    if (!driver) return new Set();

    return new Set(driver.options.flatMap((option) => option.shapeColumns));
}

export function toActiveShapeColumns(dataset: Dataset, row: GridRow, drafts: DraftChanges): Set<string> {
    const driver = dataset.columns.find((column) => column.key === dataset.shapeColumn);
    if (!driver) return new Set();

    const code = readCellValue(dataset.sheetName, row, dataset.shapeColumn, drafts);
    return new Set(driver.options.find((option) => option.code === code)?.shapeColumns ?? []);
}

function toNumber(text: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const value = Number(trimmed);
    return Number.isFinite(value) ? value : null;
}

export function validateDataset(dataset: Dataset, drafts: DraftChanges): string[] {
    const rule = dataset.validation;
    if (!rule) return [];

    const groups = new Map<string, number[]>();
    for (const row of dataset.rows) {
        const value = toNumber(readCellValue(dataset.sheetName, row, rule.column, drafts));
        if (value === null) continue;

        const name = readCellValue(dataset.sheetName, row, rule.groupColumn, drafts);
        const bucket = groups.get(name);
        if (bucket) bucket.push(value);
        else groups.set(name, [value]);
    }

    const messages: string[] = [];
    for (const [name, values] of groups) {
        if (rule.kind === 'sum') {
            const sum = values.reduce((total, value) => total + value, 0);
            if (sum !== rule.target) {
                messages.push(`${name}: ${rule.column} 합계가 ${formatCount(rule.target)}이 아닙니다 (현재 ${formatCount(sum)})`);
            }
            continue;
        }

        const decreasing = values.some((value, index) => index > 0 && value < values[index - 1]);
        if (decreasing) messages.push(`${name}: ${rule.column}이 순서대로 늘어나지 않습니다`);

        const last = values.at(-1) ?? 0;
        if (last !== rule.target) {
            messages.push(`${name}: 마지막 ${rule.column}이 ${formatCount(rule.target)}이 아닙니다 (현재 ${formatCount(last)})`);
        }
    }

    return messages;
}

export const EMPTY_CAST_CONFIG_GROUPS: FacilityGroup[] = GROUP_IDS.map((id) => ({
    ...GROUP_FALLBACKS[id],
    datasets: [],
}));

export const EMPTY_CAST_CONFIG_CATEGORIES: Category[] = [];

export const EMPTY_PRE_PROCESS_DIFF: PreProcessDiff = {
    sheetName: '',
    valueLabel: '',
    changedCount: 0,
    rows: [],
    preProcessName: '',
    preProcessAt: '',
    preProcessDt: '',
};

export const EMPTY_APPLY_HISTORIES: ApplyHistory[] = [];

export const EMPTY_CAST_CONFIG_DATASET: Dataset = {
    sheetName: '',
    dimension: '',
    columns: [],
    rows: [],
    shapeColumn: '',
    validation: null,
};
