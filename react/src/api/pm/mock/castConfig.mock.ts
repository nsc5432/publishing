import type {
    CastConfigDatasetDto,
    CastConfigGridCellDto,
    CastConfigGridRowDto,
    CastConfigGroupListDto,
    CastConfigSaveItemDto,
    JsonResponse,
    TmnlId,
} from '@/types/api.types';

interface MockRowInput {
    rowNo: number;
    values: string[];
    formulas?: Record<string, string>;
}

interface MockGroupDefinition {
    groupId: string;
    groupNm: string;
    groupNmEn: string;
    groupDesc: string;
    sheets: string[];
}

type DatasetStore = Record<string, CastConfigDatasetDto>;

const OK: JsonResponse = { error: false, errorMessage: '' };

const GROUPS: MockGroupDefinition[] = [
    {
        groupId: 'checkin',
        groupNm: '체크인 영역',
        groupNmEn: 'Check-in Facility Group',
        groupDesc: '체크인 방식, 서비스타임, 카운터 및 셀프서비스 시설코드',
        sheets: ['Check In Type', 'Check-in Counter', 'Check-in Facility Code', '서비스타임', '여객속성'],
    },
    {
        groupId: 'departure',
        groupNm: '출국장 영역',
        groupNmEn: 'Departure Hall Facility Group',
        groupDesc: '출국장 운영시간과 여객 발생·이동·리포팅 속성',
        sheets: ['Facility Opening Tables', '여객속성'],
    },
    {
        groupId: 'security',
        groupNm: '시큐리티 영역',
        groupNmEn: 'Security Facility Group',
        groupDesc: '탑승권·보안검색 서비스타임, 운영시간 및 레인 수',
        sheets: ['서비스타임', 'Facility Opening Tables', 'Facility Lane Inventory', '여객속성'],
    },
    {
        groupId: 'border',
        groupNm: '출입국심사 영역',
        groupNmEn: 'Border Control Facility Group',
        groupDesc: '출입국·검역 서비스타임, 운영시간, 레인 및 여객 속성',
        sheets: ['서비스타임', 'Facility Opening Tables', 'Facility Lane Inventory', '여객속성'],
    },
    {
        groupId: 'gate',
        groupNm: '게이트 영역',
        groupNmEn: 'Gate Facility Group',
        groupDesc: '게이트, 검역, 시설물 속성 및 게이트 리포팅 데이터',
        sheets: ['GATE Info', '시설물속성', 'Facility Lane Inventory', '여객속성'],
    },
];

function toRow(columns: string[], editableColumns: string[], input: MockRowInput): CastConfigGridRowDto {
    return {
        rowNo: input.rowNo,
        cellList: columns.map((column, index): CastConfigGridCellDto => {
            const formula = input.formulas?.[column] ?? '';
            return {
                column,
                value: input.values[index] ?? '',
                formula,
                editableYn: editableColumns.includes(column) && !formula ? 'Y' : 'N',
            };
        }),
    };
}

function toDataset(sheetNm: string, columns: string[], editableColumns: string[], inputs: MockRowInput[]): CastConfigDatasetDto {
    const endRow = inputs.at(-1)?.rowNo ?? 1;
    return {
        ...OK,
        sheetNm,
        dimension: `A2:${columns.at(-1) ?? 'A'}${endRow}`,
        columnList: columns,
        rowList: inputs.map((input) => toRow(columns, editableColumns, input)),
    };
}

function numberedRows(count: number, toValues: (index: number) => string[]): MockRowInput[] {
    return Array.from({ length: count }, (_, index) => ({
        rowNo: index + 2,
        values: toValues(index + 1),
    }));
}

function createDatasetStore(tmnlId: TmnlId): DatasetStore {
    const terminalCode = tmnlId === 'T1' ? 'P01' : 'P03';
    const terminalName = tmnlId === 'T1' ? 'Terminal 1' : 'Terminal 2';
    const counterRange = tmnlId === 'T1' ? ['A', 'N'] : ['A', 'M'];

    const checkInType = toDataset(
        'Check In Type',
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['B', 'C', 'D', 'E', 'F'],
        [
            { rowNo: 2, values: ['Type Code', '채널', '수하물', '직원', '처리 기준', '비고'] },
            { rowNo: 3, values: ['FULL', '유인 카운터', 'Y', 'Y', '일반', 'Full service'] },
            { rowNo: 4, values: ['ONLINE', '웹·모바일', 'N', 'N', '사전 처리', 'Online check-in'] },
            { rowNo: 5, values: ['KIOSK', '셀프체크인', 'N', 'N', '자동', 'Self service'] },
            { rowNo: 6, values: ['BAGDROP', '셀프백드롭', 'Y', 'N', '자동', 'Bag drop'] },
            { rowNo: 7, values: ['TRANSFER', '환승', 'Y', 'Y', '환승 전용', 'Transfer desk'] },
        ],
    );

    const checkinCounter = toDataset(
        'Check-in Counter',
        ['A', 'B', 'C', 'D'],
        ['B', 'C', 'D'],
        numberedRows(8, (index) => [
            `${terminalCode}-${counterRange[0]}${String(index).padStart(2, '0')}`,
            `${terminalName} ${counterRange[0]} Counter ${index}`,
            index % 3 === 0 ? 'DOM' : 'INT',
            index % 2 === 0 ? 'COMMON' : 'DEDICATED',
        ]),
    );

    const checkinFacilityCode = toDataset(
        'Check-in Facility Code',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ['C', 'F', 'G', 'H'],
        numberedRows(30, (index) => [
            String(index),
            index % 3 === 0 ? 'Self Bag Drop' : index % 2 === 0 ? 'Kiosk' : 'Counter',
            `${terminalCode}-CI-${String(index).padStart(3, '0')}`,
            terminalCode,
            index % 3 === 0 ? 'BAGDROP' : index % 2 === 0 ? 'KIOSK' : 'COUNTER',
            `${terminalCode}CheckinFacility${String(index).padStart(2, '0')}`,
            index % 7 === 0 ? 'N' : 'Y',
            index === 1 ? '운영 기준 확인 필요\n성수기 오픈 계획과 함께 검토' : index % 6 === 0 ? '시설코드 정합성 검토' : '',
        ]),
    );

    const serviceTime = toDataset(
        '서비스타임',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        ['C', 'D', 'E', 'G'],
        numberedRows(12, (index) => [
            `${terminalCode}-ST-${String(index).padStart(2, '0')}`,
            ['체크인', '탑승권 확인', '보안검색', '출국심사'][index % 4],
            String(35 + index * 4),
            String(50 + index * 6),
            index % 2 === 0 ? 'LOGNORMAL' : 'TRIANGULAR',
            '초',
            index % 3 === 0 ? '혼잡시간 보정' : '기본값',
        ]),
    );

    const passengerAttributes = toDataset(
        '여객속성',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ['D', 'E', 'F', 'H'],
        numberedRows(14, (index) => [
            `${terminalCode}-PA-${String(index).padStart(2, '0')}`,
            ['체크인 도착', '출국장 이용', '보안검색 이동', '게이트 도착'][index % 4],
            index % 2 === 0 ? '국제선' : '전체',
            String(5 + index),
            String(10 + index * 2),
            index % 2 === 0 ? 'MINUTE' : 'RATIO',
            terminalCode,
            index % 4 === 0 ? '운영자료 반영' : '',
        ]).map((row, index) => (index === 2 ? { ...row, formulas: { H: '=IF(D4>0,"활성","비활성")' } } : row)),
    );

    const openingTables = toDataset(
        'Facility Opening Tables',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ['C', 'D', 'E', 'F', 'G', 'H'],
        numberedRows(16, (index) => [
            terminalCode,
            `${terminalCode}-OPEN-${String(index).padStart(2, '0')}`,
            index % 3 === 0 ? 'Departure Hall' : index % 2 === 0 ? 'Security' : 'Border',
            `${String(4 + (index % 6)).padStart(2, '0')}:00`,
            `${String(18 + (index % 6)).padStart(2, '0')}:00`,
            String(2 + (index % 8)),
            index % 2 === 0 ? 'WEEKDAY' : 'WEEKEND',
            index % 5 === 0 ? '탄력 운영' : '기본 계획',
        ]),
    );

    const laneInventory = toDataset(
        'Facility Lane Inventory',
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['E', 'F'],
        numberedRows(10, (index) => [
            `${terminalCode}-LANE-${String(index).padStart(2, '0')}`,
            index % 2 === 0 ? 'Security' : 'Border',
            terminalCode,
            `Zone ${String.fromCharCode(64 + ((index - 1) % 6) + 1)}`,
            String(2 + (index % 6)),
            index % 4 === 0 ? '점검 예정' : '운영',
        ]),
    );

    const gateInfo = toDataset(
        'GATE Info',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ['D', 'E', 'F', 'H'],
        numberedRows(10, (index) => [
            String(index),
            `Gate ${100 + index}`,
            terminalCode,
            index % 2 === 0 ? 'CONTACT' : 'REMOTE',
            String(20 + index),
            String(35 + index),
            `${terminalName} Airside`,
            index % 3 === 0 ? '검역 동선 확인' : '',
        ]),
    );

    const facilityAttributes = toDataset(
        '시설물속성',
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        ['C', 'D', 'E', 'H'],
        numberedRows(8, (index) => [
            `${terminalCode}-FC-${String(index).padStart(2, '0')}`,
            ['게이트 대기좌석', '검역대', '무빙워크', '환승검색대'][index % 4],
            String(40 + index * 5),
            index % 2 === 0 ? 'OPEN' : 'SCHEDULED',
            String(1 + (index % 4)),
            terminalCode,
            `Airside ${String.fromCharCode(65 + (index % 4))}`,
            index % 3 === 0 ? '용량 재확인' : '',
        ]),
    );

    return {
        [checkInType.sheetNm]: checkInType,
        [checkinCounter.sheetNm]: checkinCounter,
        [checkinFacilityCode.sheetNm]: checkinFacilityCode,
        [serviceTime.sheetNm]: serviceTime,
        [passengerAttributes.sheetNm]: passengerAttributes,
        [openingTables.sheetNm]: openingTables,
        [laneInventory.sheetNm]: laneInventory,
        [gateInfo.sheetNm]: gateInfo,
        [facilityAttributes.sheetNm]: facilityAttributes,
    };
}

const DATASETS: Record<TmnlId, DatasetStore> = {
    T1: createDatasetStore('T1'),
    T2: createDatasetStore('T2'),
};

function emptyDataset(sheetNm: string, message: string): CastConfigDatasetDto {
    return {
        error: true,
        errorMessage: message,
        sheetNm,
        dimension: '',
        columnList: [],
        rowList: [],
    };
}

export const castConfigMock = {
    getGroupList: (tmnlId: TmnlId): CastConfigGroupListDto => ({
        ...OK,
        tmnlId,
        groupList: GROUPS.map((group) => ({
            groupId: group.groupId,
            groupNm: group.groupNm,
            groupNmEn: group.groupNmEn,
            groupDesc: group.groupDesc,
            datasetList: group.sheets.map((sheetNm) => ({
                sheetNm,
                rowCnt: DATASETS[tmnlId][sheetNm]?.rowList.length ?? 0,
            })),
        })),
    }),

    getDataset: (tmnlId: TmnlId, groupId: string, sheetNm: string): CastConfigDatasetDto => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group?.sheets.includes(sheetNm)) {
            return emptyDataset(sheetNm, '시설그룹에 연결되지 않은 원본 시트입니다.');
        }

        return DATASETS[tmnlId][sheetNm] ?? emptyDataset(sheetNm, '원본 시트를 찾지 못했습니다.');
    },

    saveDataset: (tmnlId: TmnlId, itemList: CastConfigSaveItemDto[]): JsonResponse => {
        for (const item of itemList) {
            const dataset = DATASETS[tmnlId][item.sheetNm];
            const row = dataset?.rowList.find((candidate) => candidate.rowNo === item.rowNo);
            const cell = row?.cellList.find((candidate) => candidate.column === item.column);
            if (!cell || cell.editableYn !== 'Y') {
                return { error: true, errorMessage: '수정할 수 없는 원본 셀이 포함되어 있습니다.' };
            }
            cell.value = item.value;
        }

        return OK;
    },
};
