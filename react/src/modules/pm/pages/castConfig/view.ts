import type { CastConfigDatasetDto, CastConfigGroupDto, CastConfigGroupListDto } from '@/types/api.types';
import type { Dataset, FacilityGroup, FacilityGroupId, GroupDefinition } from './types';

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

export function toCastConfigDataset(dto: CastConfigDatasetDto): Dataset {
    return {
        sheetName: dto.sheetNm,
        dimension: dto.dimension,
        columns: dto.columnList.map((column) => ({ key: column, label: column })),
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
    };
}

export const EMPTY_CAST_CONFIG_GROUPS: FacilityGroup[] = GROUP_IDS.map((id) => ({
    ...GROUP_FALLBACKS[id],
    datasets: [],
}));

export const EMPTY_CAST_CONFIG_DATASET: Dataset = {
    sheetName: '',
    dimension: '',
    columns: [],
    rows: [],
};
