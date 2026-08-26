import type {
    CastConfigCategoryDto,
    CastConfigCategoryListDto,
    CastConfigCategorySaveDto,
    CastConfigColumnDto,
    CastConfigColumnType,
    CastConfigDatasetDto,
    CastConfigGridRowDto,
    CastConfigGroupListDto,
    CastConfigOptionDto,
    CastConfigSaveItemDto,
    CastConfigValidationDto,
    JsonResponse,
    TmnlId,
} from '@/types/api.types';

interface MockColumn extends CastConfigColumnDto {
    editable: boolean;
}

interface MockRowInput {
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

const BASE_CATEGORY_ID = '001';

const CATEGORIES: CastConfigCategoryDto[] = [
    { fixAtrbGroupId: '001', atrbGroupNm: '기준정보', baseYn: 'Y', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20250101090000' },
    { fixAtrbGroupId: '002', atrbGroupNm: '추석명절 설정 정보', baseYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20260925090000' },
    { fixAtrbGroupId: '003', atrbGroupNm: '설 명절 설정 정보', baseYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20260225092000' },
    { fixAtrbGroupId: '004', atrbGroupNm: '하계 성수기 설정 정보', baseYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260701093000' },
    { fixAtrbGroupId: '005', atrbGroupNm: '동계 성수기 설정 정보', baseYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20251220091000' },
    { fixAtrbGroupId: '006', atrbGroupNm: '보안검색 강화 설정 정보', baseYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260315101500' },
    { fixAtrbGroupId: '007', atrbGroupNm: '자동출입국 확대 설정 정보', baseYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260510094000' },
    { fixAtrbGroupId: '008', atrbGroupNm: '셀프체크인 확대 설정 정보', baseYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260620090500' },
    { fixAtrbGroupId: '009', atrbGroupNm: '설 명절 설정 정보(2025)', baseYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20250225091000' },
];

const GROUPS: MockGroupDefinition[] = [
    {
        groupId: 'checkin',
        groupNm: '체크인 영역',
        groupNmEn: 'Check-in Facility Group',
        groupDesc: '체크인 방식, 서비스타임, 카운터 및 셀프서비스 시설코드',
        sheets: ['Check In Type', 'Check-in Counter', 'Check-in Facility Code', '서비스타임', '여객유형 분포'],
    },
    {
        groupId: 'departure',
        groupNm: '출국장 영역',
        groupNmEn: 'Departure Hall Facility Group',
        groupDesc: '출국장 운영시간과 여객 발생·이동·리포팅 속성',
        sheets: ['Facility Opening Tables', '여객유형 분포', '출현시간'],
    },
    {
        groupId: 'security',
        groupNm: '시큐리티 영역',
        groupNmEn: 'Security Facility Group',
        groupDesc: '탑승권·보안검색 서비스타임, 운영시간 및 레인 수',
        sheets: ['서비스타임', 'Facility Opening Tables', 'Facility Lane Inventory', '여객유형 분포'],
    },
    {
        groupId: 'border',
        groupNm: '출입국심사 영역',
        groupNmEn: 'Border Control Facility Group',
        groupDesc: '출입국·검역 서비스타임, 운영시간, 레인 및 여객 속성',
        sheets: ['서비스타임', 'Facility Opening Tables', 'Facility Lane Inventory', '여객유형 분포'],
    },
    {
        groupId: 'gate',
        groupNm: '게이트 영역',
        groupNmEn: 'Gate Facility Group',
        groupDesc: '게이트, 검역, 시설물 속성 및 게이트 리포팅 데이터',
        sheets: ['GATE Info', '시설물속성', 'Facility Lane Inventory', '출현시간'],
    },
];

const DISTRIBUTION_OPTIONS: CastConfigOptionDto[] = [
    { code: 'TIDConstant', label: 'TIDConstant', shapeColumnList: ['Value'] },
    { code: 'TIDRandomized', label: 'TIDRandomized', shapeColumnList: ['Min', 'Max'] },
    { code: 'TIDTriangle', label: 'TIDTriangle', shapeColumnList: ['a', 'b', 'c'] },
    { code: 'TIDNegExp', label: 'TIDNegExp', shapeColumnList: ['Value'] },
    { code: 'TIDNormal', label: 'TIDNormal', shapeColumnList: ['Min', 'Max'] },
    { code: 'TIDErlang', label: 'TIDErlang', shapeColumnList: ['Min', 'Max'] },
];

function toOptions(codes: string[]): CastConfigOptionDto[] {
    return codes.map((code) => ({ code, label: code, shapeColumnList: [] }));
}

function column(columnName: string, type: CastConfigColumnType, extra: Partial<Pick<MockColumn, 'editable' | 'mergeYn' | 'optionList'>> = {}): MockColumn {
    return {
        column: columnName,
        label: columnName,
        type,
        optionList: extra.optionList ?? [],
        mergeYn: extra.mergeYn ?? 'N',
        editable: extra.editable ?? type !== 'READONLY',
    };
}

function toRow(columns: MockColumn[], rowNo: number, input: MockRowInput): CastConfigGridRowDto {
    return {
        rowNo,
        cellList: columns.map((col, index) => {
            const formula = input.formulas?.[col.column] ?? '';
            return {
                column: col.column,
                value: input.values[index] ?? '',
                formula,
                editableYn: col.editable && !formula ? ('Y' as const) : ('N' as const),
            };
        }),
    };
}

function toDataset(
    sheetNm: string,
    columns: MockColumn[],
    inputs: MockRowInput[],
    extra: { shapeColumn?: string; validation?: CastConfigValidationDto } = {},
): CastConfigDatasetDto {
    return {
        ...OK,
        sheetNm,
        dimension: '',
        columnList: columns.map((col) => ({
            column: col.column,
            label: col.label,
            type: col.type,
            optionList: col.optionList,
            mergeYn: col.mergeYn,
        })),
        rowList: inputs.map((input, index) => toRow(columns, index + 2, input)),
        shapeColumn: extra.shapeColumn ?? '',
        validation: extra.validation ?? null,
    };
}

function numberedRows(count: number, toValues: (index: number) => string[]): MockRowInput[] {
    return Array.from({ length: count }, (_, index) => ({ values: toValues(index + 1) }));
}

function createDatasetStore(tmnlId: TmnlId): DatasetStore {
    const terminalCode = tmnlId === 'T1' ? 'P01' : 'P03';
    const terminalName = tmnlId === 'T1' ? 'Terminal 1' : 'Terminal 2';

    const checkInType = toDataset(
        'Check In Type',
        [
            column('유형코드', 'READONLY'),
            column('채널', 'TEXT'),
            column('수하물', 'SELECT', { optionList: toOptions(['Y', 'N']) }),
            column('처리기준', 'TEXT'),
            column('비고', 'TEXT'),
        ],
        [
            { values: ['FULL', '유인 카운터', 'Y', '일반', 'Full service'] },
            { values: ['ONLINE', '웹·모바일', 'N', '사전 처리', 'Online check-in'] },
            { values: ['KIOSK', '셀프체크인', 'N', '자동', 'Self service'] },
            { values: ['BAGDROP', '셀프백드롭', 'Y', '자동', 'Bag drop'] },
            { values: ['TRANSFER', '환승', 'Y', '환승 전용', 'Transfer desk'] },
        ],
    );

    const checkinCounter = toDataset(
        'Check-in Counter',
        [
            column('카운터코드', 'READONLY'),
            column('카운터명', 'TEXT'),
            column('노선구분', 'SELECT', { optionList: toOptions(['INT', 'DOM']) }),
            column('운영구분', 'SELECT', { optionList: toOptions(['COMMON', 'DEDICATED']) }),
        ],
        numberedRows(8, (index) => [
            `${terminalCode}-A${String(index).padStart(2, '0')}`,
            `${terminalName} A Counter ${index}`,
            index % 3 === 0 ? 'DOM' : 'INT',
            index % 2 === 0 ? 'COMMON' : 'DEDICATED',
        ]),
    );

    const checkinFacilityCode = toDataset(
        'Check-in Facility Code',
        [
            column('순번', 'READONLY'),
            column('시설유형', 'SELECT', { optionList: toOptions(['COUNTER', 'KIOSK', 'BAGDROP']) }),
            column('시설코드', 'READONLY'),
            column('시뮬레이션시설명', 'TEXT'),
            column('처리용량', 'NUMBER'),
            column('비고', 'TEXT'),
        ],
        numberedRows(30, (index) => [
            String(index),
            index % 3 === 0 ? 'BAGDROP' : index % 2 === 0 ? 'KIOSK' : 'COUNTER',
            `${terminalCode}-CI-${String(index).padStart(3, '0')}`,
            `${terminalCode}CheckinFacility${String(index).padStart(2, '0')}`,
            String(120 + index * 3),
            index === 1 ? '운영 기준 확인 필요' : index % 6 === 0 ? '시설코드 정합성 검토' : '',
        ]).map((row, index) => (index === 2 ? { ...row, formulas: { 비고: '=IF(처리용량>0,"활성","비활성")' } } : row)),
    );

    const serviceTime = toDataset(
        '서비스타임',
        [
            column('시설물종류', 'READONLY'),
            column('분포 함수유형', 'SELECT', { optionList: DISTRIBUTION_OPTIONS }),
            column('Value', 'NUMBER'),
            column('Min', 'NUMBER'),
            column('Max', 'NUMBER'),
            column('a', 'NUMBER'),
            column('b', 'NUMBER'),
            column('c', 'NUMBER'),
        ],
        [
            { values: ['보딩패스컨트롤 국제선 안면인식', 'TIDRandomized', '', '22', '22', '', '', ''] },
            { values: [`보안검색대 ${tmnlId}DG1`, 'TIDConstant', '22', '', '', '', '', ''] },
            { values: [`보안검색대 ${tmnlId}DG2`, 'TIDConstant', '22', '', '', '', '', ''] },
            { values: [`보안검색대 ${tmnlId}DG3`, 'TIDConstant', '22', '', '', '', '', ''] },
            { values: ['여권심사일반 대한민국 일반', 'TIDTriangle', '', '', '', '8', '36', '22'] },
            { values: ['여권심사일반 외국인 일반', 'TIDTriangle', '', '', '', '12', '48', '30'] },
            { values: ['자동출입국심사대', 'TIDNegExp', '18', '', '', '', '', ''] },
            { values: ['세관검사 일반', 'TIDNormal', '', '15', '40', '', '', ''] },
        ],
        { shapeColumn: '분포 함수유형' },
    );

    const passengerShare = toDataset(
        '여객유형 분포',
        [column('중분류', 'READONLY', { mergeYn: 'Y' }), column('소분류', 'READONLY'), column('기준값', 'NUMBER')],
        [
            { values: [`${tmnlId} 국제선 개별여객`, '대한민국 국적', '58'] },
            { values: [`${tmnlId} 국제선 개별여객`, '외국인 국적', '42'] },
            { values: [`${tmnlId} 국내선 개별여객`, '대한민국 국적', '58'] },
            { values: [`${tmnlId} 국내선 개별여객`, '외국인 국적', '42'] },
            { values: [`${tmnlId} 국제선 단체여객`, '대한민국 국적', '35'] },
            { values: [`${tmnlId} 국제선 단체여객`, '외국인 국적', '65'] },
        ],
        { validation: { kind: 'SUM', column: '기준값', groupColumn: '중분류', target: 100 } },
    );

    const showUpTime = toDataset(
        '출현시간',
        [column('중분류', 'READONLY', { mergeYn: 'Y' }), column('소분류', 'READONLY'), column('시간대', 'TIME'), column('비율', 'NUMBER')],
        ['그룹1', '그룹2', '그룹3'].flatMap((group) =>
            [
                ['1', '01:40:00', '0'],
                ['2', '01:30:00', '12'],
                ['3', '01:00:00', '46'],
                ['4', '00:30:00', '78'],
                ['5', '00:10:00', '100'],
            ].map((step) => ({ values: [`${tmnlId} 출발여객 ${group}`, ...step] })),
        ),
        { validation: { kind: 'CUMULATIVE', column: '비율', groupColumn: '중분류', target: 100 } },
    );

    const openingTables = toDataset(
        'Facility Opening Tables',
        [
            column('터미널아이디', 'READONLY'),
            column('시설구분', 'SELECT', { optionList: toOptions(['Departure Hall', 'Security', 'Border']), mergeYn: 'Y' }),
            column('운영시작', 'TIME'),
            column('운영종료', 'TIME'),
            column('시설물수', 'NUMBER'),
        ],
        numberedRows(16, (index) => [
            terminalCode,
            index % 3 === 0 ? 'Departure Hall' : index % 2 === 0 ? 'Security' : 'Border',
            `${String(4 + (index % 6)).padStart(2, '0')}:00:00`,
            `${String(18 + (index % 6)).padStart(2, '0')}:00:00`,
            String(2 + (index % 8)),
        ]),
    );

    const laneInventory = toDataset(
        'Facility Lane Inventory',
        [
            column('시설코드', 'READONLY'),
            column('시설구분', 'SELECT', { optionList: toOptions(['Security', 'Border']), mergeYn: 'Y' }),
            column('구역', 'TEXT'),
            column('레인수', 'NUMBER'),
        ],
        numberedRows(10, (index) => [
            `${terminalCode}-LANE-${String(index).padStart(2, '0')}`,
            index % 2 === 0 ? 'Security' : 'Border',
            `Zone ${String.fromCharCode(65 + ((index - 1) % 6))}`,
            String(2 + (index % 6)),
        ]),
    );

    const gateInfo = toDataset(
        'GATE Info',
        [
            column('게이트번호', 'READONLY'),
            column('터미널아이디', 'READONLY'),
            column('게이트유형', 'SELECT', { optionList: toOptions(['CONTACT', 'REMOTE']) }),
            column('좌석수', 'NUMBER'),
        ],
        numberedRows(10, (index) => [`Gate ${100 + index}`, terminalCode, index % 2 === 0 ? 'CONTACT' : 'REMOTE', String(120 + index * 5)]),
    );

    const facilityAttributes = toDataset(
        '시설물속성',
        [
            column('시설코드', 'READONLY'),
            column('시설명', 'TEXT'),
            column('처리용량', 'NUMBER'),
            column('운영구분', 'SELECT', { optionList: toOptions(['OPEN', 'SCHEDULED']) }),
        ],
        numberedRows(8, (index) => [
            `${terminalCode}-FC-${String(index).padStart(2, '0')}`,
            ['게이트 대기좌석', '검역대', '무빙워크', '환승검색대'][index % 4],
            String(40 + index * 5),
            index % 2 === 0 ? 'OPEN' : 'SCHEDULED',
        ]),
    );

    return Object.fromEntries(
        [
            checkInType,
            checkinCounter,
            checkinFacilityCode,
            serviceTime,
            passengerShare,
            showUpTime,
            openingTables,
            laneInventory,
            gateInfo,
            facilityAttributes,
        ].map((dataset) => [dataset.sheetNm, dataset]),
    );
}

function toReadOnlyStore(store: DatasetStore): DatasetStore {
    const clone = structuredClone(store);
    for (const dataset of Object.values(clone)) {
        for (const row of dataset.rowList) {
            for (const cell of row.cellList) cell.editableYn = 'N';
        }
    }
    return clone;
}

function createTerminalStore(tmnlId: TmnlId): Record<string, DatasetStore> {
    const editable = createDatasetStore(tmnlId);
    const store: Record<string, DatasetStore> = { [BASE_CATEGORY_ID]: toReadOnlyStore(editable) };

    for (const category of CATEGORIES) {
        if (category.baseYn === 'Y') continue;
        store[category.fixAtrbGroupId] = structuredClone(editable);
    }

    return store;
}

const DATASETS: Record<TmnlId, Record<string, DatasetStore>> = {
    T1: createTerminalStore('T1'),
    T2: createTerminalStore('T2'),
};

function emptyDataset(sheetNm: string, message: string): CastConfigDatasetDto {
    return {
        error: true,
        errorMessage: message,
        sheetNm,
        dimension: '',
        columnList: [],
        rowList: [],
        shapeColumn: '',
        validation: null,
    };
}

function findDataset(tmnlId: TmnlId, fixAtrbGroupId: string, sheetNm: string): CastConfigDatasetDto | undefined {
    return DATASETS[tmnlId][fixAtrbGroupId]?.[sheetNm];
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
                rowCnt: findDataset(tmnlId, BASE_CATEGORY_ID, sheetNm)?.rowList.length ?? 0,
            })),
        })),
    }),

    getCategoryList: (): CastConfigCategoryListDto => ({
        ...OK,
        totalCnt: CATEGORIES.length,
        categoryList: structuredClone(CATEGORIES),
    }),

    saveCategory: (dto: CastConfigCategorySaveDto): JsonResponse => {
        if (CATEGORIES.some((category) => category.fixAtrbGroupId === dto.fixAtrbGroupId)) {
            return { error: true, errorMessage: '이미 등록된 카테고리 코드입니다.' };
        }

        CATEGORIES.push({
            fixAtrbGroupId: dto.fixAtrbGroupId,
            atrbGroupNm: dto.atrbGroupNm,
            baseYn: 'N',
            cfmtnYn: 'N',
            groupPrcsSttsCd: '01',
            frstRegDt: dto.frstRegDt,
        });

        for (const tmnlId of ['T1', 'T2'] as TmnlId[]) {
            const base = DATASETS[tmnlId][BASE_CATEGORY_ID];
            const created: DatasetStore = {};
            for (const sheetNm of dto.sheetNmList) {
                const source = base[sheetNm];
                if (!source) continue;
                const dataset = structuredClone(source);
                for (const row of dataset.rowList) {
                    for (const cell of row.cellList) {
                        cell.editableYn = cell.formula ? 'N' : 'Y';
                    }
                }
                created[sheetNm] = dataset;
            }
            DATASETS[tmnlId][dto.fixAtrbGroupId] = created;
        }

        return OK;
    },

    getDataset: (tmnlId: TmnlId, fixAtrbGroupId: string, groupId: string, sheetNm: string): CastConfigDatasetDto => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group?.sheets.includes(sheetNm)) {
            return emptyDataset(sheetNm, '시설그룹에 연결되지 않은 원본 시트입니다.');
        }

        return findDataset(tmnlId, fixAtrbGroupId, sheetNm) ?? emptyDataset(sheetNm, '이 카테고리에 등록되지 않은 시트입니다.');
    },

    saveDataset: (tmnlId: TmnlId, groupId: string, itemList: CastConfigSaveItemDto[]): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group || itemList.some((item) => !group.sheets.includes(item.sheetNm))) {
            return { error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
        }
        if (itemList.some((item) => item.fixAtrbGroupId === BASE_CATEGORY_ID)) {
            return { error: true, errorMessage: '기준정보는 수정할 수 없습니다.' };
        }

        for (const item of itemList) {
            const dataset = findDataset(tmnlId, item.fixAtrbGroupId, item.sheetNm);
            const row = dataset?.rowList.find((candidate) => candidate.rowNo === item.rowNo);
            if (!row) return { error: true, errorMessage: '저장할 행을 찾지 못했습니다.' };

            const cell = row.cellList.find((candidate) => candidate.column === item.column);
            if (!cell || cell.editableYn !== 'Y') {
                return { error: true, errorMessage: '수정할 수 없는 원본 셀이 포함되어 있습니다.' };
            }
            cell.value = item.value;
        }

        return OK;
    },

    applyDefault: (tmnlId: TmnlId, groupId: string, fixAtrbGroupId: string, sheetNm: string, rowNoList: number[]): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group?.sheets.includes(sheetNm)) {
            return { error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
        }

        const base = findDataset(tmnlId, BASE_CATEGORY_ID, sheetNm);
        const target = findDataset(tmnlId, fixAtrbGroupId, sheetNm);
        if (!base || !target) return { error: true, errorMessage: '기준정보를 찾지 못했습니다.' };

        for (const row of target.rowList) {
            if (rowNoList.length > 0 && !rowNoList.includes(row.rowNo)) continue;
            const source = base.rowList.find((candidate) => candidate.rowNo === row.rowNo);
            if (!source) continue;

            for (const cell of row.cellList) {
                const sourceCell = source.cellList.find((candidate) => candidate.column === cell.column);
                if (sourceCell) cell.value = sourceCell.value;
            }
        }

        return OK;
    },

    uploadExcel: (_tmnlId: TmnlId, groupId: string, sheetNm: string): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        return group?.sheets.includes(sheetNm) ? OK : { error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
    },
};
