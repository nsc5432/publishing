import type {
    CastConfigAplyHstryDto,
    CastConfigAplyHstryListDto,
    CastConfigCategoryDto,
    CastConfigCategoryListDto,
    CastConfigCategorySaveDto,
    CastConfigColumnDto,
    CastConfigColumnType,
    CastConfigDatasetDto,
    CastConfigGridRowDto,
    CastConfigGroupListDto,
    CastConfigOptionDto,
    CastConfigPreProcessDiffDto,
    CastConfigPreProcessRowDto,
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

interface MockSnapshot {
    rowNo: number;
    column: string;
    value: string;
}

interface MockHistory {
    hstry: CastConfigAplyHstryDto;
    snapshot: MockSnapshot[];
}

type DatasetStore = Record<string, CastConfigDatasetDto>;

const OK: JsonResponse = { error: false, errorMessage: '' };

const BASE_CATEGORY_ID = '001';
const PRE_PRCS_CATEGORY_ID = '999';

const CATEGORIES: CastConfigCategoryDto[] = [
    { fixAtrbGroupId: '001', atrbGroupNm: '기준정보', baseYn: 'Y', prePrcsYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20250101090000', lastMdfcnDt: '20250101090000' },
    { fixAtrbGroupId: '002', atrbGroupNm: '추석명절 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20260925090000', lastMdfcnDt: '20260925090000' },
    { fixAtrbGroupId: '003', atrbGroupNm: '설 명절 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20260225092000', lastMdfcnDt: '20260225092000' },
    { fixAtrbGroupId: '004', atrbGroupNm: '하계 성수기 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260701093000', lastMdfcnDt: '20260701093000' },
    { fixAtrbGroupId: '005', atrbGroupNm: '동계 성수기 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20251220091000', lastMdfcnDt: '20251220091000' },
    { fixAtrbGroupId: '006', atrbGroupNm: '보안검색 강화 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260315101500', lastMdfcnDt: '20260315101500' },
    { fixAtrbGroupId: '007', atrbGroupNm: '자동출입국 확대 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260510094000', lastMdfcnDt: '20260510094000' },
    { fixAtrbGroupId: '008', atrbGroupNm: '셀프체크인 확대 설정 정보', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'N', groupPrcsSttsCd: '01', frstRegDt: '20260620090500', lastMdfcnDt: '20260620090500' },
    { fixAtrbGroupId: '009', atrbGroupNm: '설 명절 설정 정보(2025)', baseYn: 'N', prePrcsYn: 'N', cfmtnYn: 'Y', groupPrcsSttsCd: '01', frstRegDt: '20250225091000', lastMdfcnDt: '20250225091000' },
    {
        fixAtrbGroupId: PRE_PRCS_CATEGORY_ID,
        atrbGroupNm: '전처리 결과 (260212-260218)',
        baseYn: 'N',
        prePrcsYn: 'Y',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20250101090000',
        lastMdfcnDt: '20260219010712',
    },
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

// 실제 서버는 카탈로그의 PRE_PRCS_YN 으로 가른다. 목업은 행 번호로 흉내만 낸다.
function isPreProcessRow(rowNo: number): boolean {
    return rowNo % 3 === 0;
}

function findValueColumn(dataset: CastConfigDatasetDto): string {
    return (dataset.columnList.find((column) => column.type === 'NUMBER') ?? dataset.columnList.at(-1))?.column ?? '';
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

// 전처리 결과는 파이프라인이 만든 값이라 화면에서 고칠 수 없다. 몇 칸을 흔들어 비교표에 변화가 보이게 한다.
function toPreProcessStore(store: DatasetStore): DatasetStore {
    const clone = toReadOnlyStore(store);

    for (const dataset of Object.values(clone)) {
        const valueColumn = findValueColumn(dataset);
        if (!valueColumn) continue;

        for (const row of dataset.rowList) {
            if (!isPreProcessRow(row.rowNo)) continue;

            const cell = row.cellList.find((candidate) => candidate.column === valueColumn);
            const current = Number(cell?.value);
            // Number('') 은 0 이라 빈 칸까지 숫자가 돼 버린다
            if (!cell || cell.value.trim() === '' || !Number.isFinite(current)) continue;

            cell.value = String(Math.max(0, current + ((row.rowNo % 5) - 2)));
        }
    }

    return clone;
}

function createTerminalStore(tmnlId: TmnlId): Record<string, DatasetStore> {
    const editable = createDatasetStore(tmnlId);
    const base = toReadOnlyStore(editable);
    const store: Record<string, DatasetStore> = {
        [BASE_CATEGORY_ID]: base,
        [PRE_PRCS_CATEGORY_ID]: toPreProcessStore(base),
    };

    for (const category of CATEGORIES) {
        if (category.baseYn === 'Y' || category.prePrcsYn === 'Y') continue;
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

function readCell(dataset: CastConfigDatasetDto, rowNo: number, column: string): string {
    return dataset.rowList.find((row) => row.rowNo === rowNo)?.cellList.find((cell) => cell.column === column)?.value ?? '';
}

function toPreProcessRow(
    base: CastConfigDatasetDto,
    pre: CastConfigDatasetDto,
    row: CastConfigGridRowDto,
    valueColumn: string,
): CastConfigPreProcessRowDto {
    const preVl = pre.rowList.some((candidate) => candidate.rowNo === row.rowNo) ? readCell(pre, row.rowNo, valueColumn) : '';
    const baseVl = readCell(base, row.rowNo, valueColumn);
    const matched = preVl !== '';

    return {
        rowNo: row.rowNo,
        atrbCd: String(row.rowNo).padStart(8, '0'),
        dtlSeCd: String(row.rowNo + 1).padStart(8, '0'),
        atrbCdNm: row.cellList[0]?.value ?? '',
        dtlSeCdNm: row.cellList[1]?.value ?? '',
        baseVl,
        preVl,
        changedYn: matched && baseVl !== preVl ? 'Y' : 'N',
        matchedYn: matched ? 'Y' : 'N',
    };
}

function toCategoryOrder(category: CastConfigCategoryDto): number {
    if (category.fixAtrbGroupId === BASE_CATEGORY_ID) return 0;
    if (category.fixAtrbGroupId === PRE_PRCS_CATEGORY_ID) return 1;
    return 2;
}

function toNowYmdHms(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const EMPTY_DIFF: CastConfigPreProcessDiffDto = {
    ...OK,
    sheetNm: '',
    valueColumn: '',
    valueLabel: '',
    changedCnt: 0,
    rowList: [],
    preProcessNm: '',
    preProcessDt: '',
};

const HISTORIES: MockHistory[] = [];
let aplySnSeq = 0;

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
        // 서버 ORDER BY 와 같은 순서: 기준정보 → 전처리 결과 → 나머지
        categoryList: structuredClone(CATEGORIES).sort((a, b) => toCategoryOrder(a) - toCategoryOrder(b) || a.fixAtrbGroupId.localeCompare(b.fixAtrbGroupId)),
    }),

    saveCategory: (dto: CastConfigCategorySaveDto): JsonResponse => {
        if (CATEGORIES.some((category) => category.fixAtrbGroupId === dto.fixAtrbGroupId)) {
            return { error: true, errorMessage: '이미 등록된 카테고리 코드입니다.' };
        }

        CATEGORIES.push({
            fixAtrbGroupId: dto.fixAtrbGroupId,
            atrbGroupNm: dto.atrbGroupNm,
            baseYn: 'N',
            prePrcsYn: 'N',
            cfmtnYn: 'N',
            groupPrcsSttsCd: '01',
            frstRegDt: dto.frstRegDt,
            lastMdfcnDt: dto.frstRegDt,
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

    getPreProcessDiff: (tmnlId: TmnlId, groupId: string, sheetNm: string): CastConfigPreProcessDiffDto => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group?.sheets.includes(sheetNm)) {
            return { ...EMPTY_DIFF, error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
        }

        const base = findDataset(tmnlId, BASE_CATEGORY_ID, sheetNm);
        const pre = findDataset(tmnlId, PRE_PRCS_CATEGORY_ID, sheetNm);
        if (!base || !pre) return { ...EMPTY_DIFF, error: true, errorMessage: '전처리 결과를 찾지 못했습니다.' };

        const valueColumn = findValueColumn(base);
        const rowList = base.rowList.filter((row) => isPreProcessRow(row.rowNo)).map((row) => toPreProcessRow(base, pre, row, valueColumn));
        const category = CATEGORIES.find((item) => item.fixAtrbGroupId === PRE_PRCS_CATEGORY_ID);

        return {
            ...OK,
            sheetNm,
            valueColumn,
            valueLabel: base.columnList.find((column) => column.column === valueColumn)?.label ?? valueColumn,
            changedCnt: rowList.filter((row) => row.changedYn === 'Y').length,
            rowList,
            preProcessNm: category?.atrbGroupNm ?? '',
            preProcessDt: category?.lastMdfcnDt ?? '',
        };
    },

    applyPreProcess: (tmnlId: TmnlId, groupId: string, sheetNm: string, rowNoList: number[]): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group?.sheets.includes(sheetNm)) {
            return { error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
        }

        if (rowNoList.length === 0) return { error: true, errorMessage: '반영할 행을 선택해 주세요.' };

        const base = findDataset(tmnlId, BASE_CATEGORY_ID, sheetNm);
        const pre = findDataset(tmnlId, PRE_PRCS_CATEGORY_ID, sheetNm);
        if (!base || !pre) return { error: true, errorMessage: '전처리 결과를 찾지 못했습니다.' };

        const valueColumn = findValueColumn(base);
        const snapshot: MockSnapshot[] = [];

        for (const rowNo of rowNoList) {
            const row = base.rowList.find((candidate) => candidate.rowNo === rowNo);
            const source = pre.rowList.find((candidate) => candidate.rowNo === rowNo);
            if (!row || !source || !isPreProcessRow(rowNo)) {
                return { error: true, errorMessage: '전처리 대상이 아닌 행이 포함되어 있습니다.' };
            }

            const cell = row.cellList.find((candidate) => candidate.column === valueColumn);
            const sourceCell = source.cellList.find((candidate) => candidate.column === valueColumn);
            if (!cell || !sourceCell) continue;

            snapshot.push({ rowNo, column: valueColumn, value: cell.value });
            cell.value = sourceCell.value;
        }

        HISTORIES.unshift({
            hstry: {
                aplySn: ++aplySnSeq,
                srcFixAtrbGroupId: PRE_PRCS_CATEGORY_ID,
                tgtFixAtrbGroupId: BASE_CATEGORY_ID,
                tmnlId,
                tblNm: 'TN_PM_SMLT_PSG_ATRB',
                sheetNm,
                aplyRowCnt: snapshot.length,
                cnclYn: 'N',
                frstRegDt: toNowYmdHms(),
                frstRgtrId: 'PM001',
            },
            snapshot,
        });

        return OK;
    },

    getPreProcessHistory: (tmnlId: TmnlId, sheetNm: string): CastConfigAplyHstryListDto => {
        const hstryList = HISTORIES.filter((item) => item.hstry.tmnlId === tmnlId && (!sheetNm || item.hstry.sheetNm === sheetNm)).map((item) => item.hstry);

        return { ...OK, totalCnt: hstryList.length, hstryList: structuredClone(hstryList) };
    },

    revertPreProcess: (aplySn: number): JsonResponse => {
        const entry = HISTORIES.find((item) => item.hstry.aplySn === aplySn);
        if (!entry) return { error: true, errorMessage: '반영 이력을 찾지 못했습니다.' };
        if (entry.hstry.cnclYn === 'Y') return { error: true, errorMessage: '이미 되돌린 이력입니다.' };

        const base = findDataset(entry.hstry.tmnlId as TmnlId, BASE_CATEGORY_ID, entry.hstry.sheetNm);
        if (!base) return { error: true, errorMessage: '기준정보를 찾지 못했습니다.' };

        for (const item of entry.snapshot) {
            const cell = base.rowList.find((row) => row.rowNo === item.rowNo)?.cellList.find((candidate) => candidate.column === item.column);
            if (cell) cell.value = item.value;
        }

        entry.hstry.cnclYn = 'Y';

        return OK;
    },

    uploadExcel: (_tmnlId: TmnlId, groupId: string, sheetNm: string): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        return group?.sheets.includes(sheetNm) ? OK : { error: true, errorMessage: '시설그룹에 연결되지 않은 원본 시트입니다.' };
    },
};
