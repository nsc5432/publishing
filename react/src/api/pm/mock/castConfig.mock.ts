import type {
    CastConfigAplyHstryDto,
    CastConfigAplyHstryListDto,
    CastConfigAplySetHstryDto,
    CastConfigAplySetHstryListDto,
    CastConfigCategoryCloneDto,
    CastConfigCategoryCloneResultDto,
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
    CastConfigSetDto,
    CastConfigSetSaveItemDto,
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
    // hstry.tmnlId 는 터미널 축이 없는 시트에서 비므로 되돌릴 데이터셋을 찾을 축을 따로 둔다
    terminal: TmnlId;
    snapshot: MockSnapshot[];
}

interface MockSetSnapshot {
    terminal: TmnlId;
    sheetName: string;
    dataset: CastConfigDatasetDto;
}

interface MockApplySet {
    hstry: CastConfigAplySetHstryDto;
    snapshots: MockSetSnapshot[];
}

type DatasetStore = Record<string, CastConfigDatasetDto>;

const OK: JsonResponse = { error: false, errorMessage: '' };

const BASE_CATEGORY_ID = '001';
const PRE_PRCS_CATEGORY_ID = '999';

const CKNCT_TYPE_SHEET = '체크인유형';
const CKNCT_TYPE_VALUE_COLUMNS = ['카운터비율', '키오스크비율', '모바일비율'];
const TABLE_BY_SHEET: Record<string, string> = { [CKNCT_TYPE_SHEET]: 'TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC' };

const CATEGORIES: CastConfigCategoryDto[] = [
    {
        fixAtrbGroupId: '001',
        atrbGroupNm: '기준정보',
        baseYn: 'Y',
        prePrcsYn: 'N',
        cfmtnYn: 'Y',
        groupPrcsSttsCd: '01',
        frstRegDt: '20250101090000',
        lastMdfcnDt: '20250101090000',
    },
    {
        fixAtrbGroupId: '002',
        atrbGroupNm: '추석명절 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'Y',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260925090000',
        lastMdfcnDt: '20260925090000',
    },
    {
        fixAtrbGroupId: '003',
        atrbGroupNm: '설 명절 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'Y',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260225092000',
        lastMdfcnDt: '20260225092000',
    },
    {
        fixAtrbGroupId: '004',
        atrbGroupNm: '하계 성수기 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260701093000',
        lastMdfcnDt: '20260701093000',
    },
    {
        fixAtrbGroupId: '005',
        atrbGroupNm: '동계 성수기 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20251220091000',
        lastMdfcnDt: '20251220091000',
    },
    {
        fixAtrbGroupId: '006',
        atrbGroupNm: '보안검색 강화 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260315101500',
        lastMdfcnDt: '20260315101500',
    },
    {
        fixAtrbGroupId: '007',
        atrbGroupNm: '자동출입국 확대 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260510094000',
        lastMdfcnDt: '20260510094000',
    },
    {
        fixAtrbGroupId: '008',
        atrbGroupNm: '셀프체크인 확대 설정 정보',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'N',
        groupPrcsSttsCd: '01',
        frstRegDt: '20260620090500',
        lastMdfcnDt: '20260620090500',
    },
    {
        fixAtrbGroupId: '009',
        atrbGroupNm: '설 명절 설정 정보(2025)',
        baseYn: 'N',
        prePrcsYn: 'N',
        cfmtnYn: 'Y',
        groupPrcsSttsCd: '01',
        frstRegDt: '20250225091000',
        lastMdfcnDt: '20250225091000',
    },
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
        sheets: ['Check In Type', 'Check-in Counter', 'Check-in Facility Code', '서비스타임', '여객유형 분포', CKNCT_TYPE_SHEET],
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
function isPreProcessRow(sheetNm: string, rowNo: number): boolean {
    if (sheetNm === CKNCT_TYPE_SHEET) return true;
    return rowNo % 3 === 0;
}

function findValueColumns(dataset: CastConfigDatasetDto): string[] {
    if (dataset.sheetNm === CKNCT_TYPE_SHEET) return CKNCT_TYPE_VALUE_COLUMNS;

    const column = (dataset.columnList.find((item) => item.type === 'NUMBER') ?? dataset.columnList.at(-1))?.column;
    return column ? [column] : [];
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
        const valueColumnList = findValueColumns(dataset);

        for (const row of dataset.rowList) {
            if (!isPreProcessRow(dataset.sheetNm, row.rowNo)) continue;

            valueColumnList.forEach((valueColumn, index) => {
                const cell = row.cellList.find((candidate) => candidate.column === valueColumn);
                const current = Number(cell?.value);
                // Number('') 은 0 이라 빈 칸까지 숫자가 돼 버린다
                if (!cell || cell.value.trim() === '' || !Number.isFinite(current)) return;

                cell.value = String(Math.max(0, current + (((row.rowNo + index) % 5) - 2)));
            });
        }
    }

    return clone;
}

// 항공사 단위라 T1/T2 구분이 없다. 두 터미널이 같은 객체를 공유해야
// 한쪽에서 반영한 결과가 다른 탭에도 그대로 보인다.
function createCknctTypeDatasets(): Record<string, CastConfigDatasetDto> {
    const columns = [
        column('항공사코드', 'READONLY', { mergeYn: 'Y' }),
        column('카운터비율', 'NUMBER'),
        column('키오스크비율', 'NUMBER'),
        column('모바일비율', 'NUMBER'),
        column('서비스시간', 'NUMBER'),
    ];
    const inputs: MockRowInput[] = [
        { values: ['KE', '52', '31', '17', '78.5'] },
        { values: ['OZ', '55', '28', '17', '81.2'] },
        { values: ['7C', '38', '41', '21', '64.0'] },
        { values: ['LJ', '41', '38', '21', '66.3'] },
        { values: ['TW', '44', '36', '20', '69.1'] },
        { values: ['ZE', '40', '39', '21', '65.4'] },
        { values: ['BX', '47', '33', '20', '72.8'] },
        { values: ['RS', '49', '32', '19', '74.6'] },
        { values: ['JL', '58', '26', '16', '85.0'] },
        { values: ['NH', '57', '27', '16', '84.2'] },
        { values: ['CA', '63', '22', '15', '92.4'] },
        { values: ['TG', '61', '24', '15', '89.7'] },
    ];

    const editable = { [CKNCT_TYPE_SHEET]: toDataset(CKNCT_TYPE_SHEET, columns, inputs) };
    const base = toReadOnlyStore(editable);
    const result: Record<string, CastConfigDatasetDto> = {
        [BASE_CATEGORY_ID]: base[CKNCT_TYPE_SHEET],
        [PRE_PRCS_CATEGORY_ID]: toPreProcessStore(base)[CKNCT_TYPE_SHEET],
    };

    for (const category of CATEGORIES) {
        if (category.baseYn === 'Y' || category.prePrcsYn === 'Y') continue;
        result[category.fixAtrbGroupId] = structuredClone(editable)[CKNCT_TYPE_SHEET];
    }

    return result;
}

const CKNCT_TYPE_DATASETS = createCknctTypeDatasets();

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

    for (const [categoryId, dataset] of Object.entries(CKNCT_TYPE_DATASETS)) {
        store[categoryId][CKNCT_TYPE_SHEET] = dataset;
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

const HISTORIES: MockHistory[] = [];
let aplySnSeq = 0;
const APPLY_SET_HISTORIES: MockApplySet[] = [];
let aplySetSnSeq = 0;

function toEditableDataset(dataset: CastConfigDatasetDto): CastConfigDatasetDto {
    const clone = structuredClone(dataset);
    for (const row of clone.rowList) {
        for (const cell of row.cellList) cell.editableYn = cell.formula ? 'N' : 'Y';
    }
    return clone;
}

function copyDatasetValues(source: CastConfigDatasetDto, target: CastConfigDatasetDto, preProcess: boolean): number {
    const valueColumns = preProcess
        ? findValueColumns(source)
        : source.columnList.filter((column) => column.type !== 'READONLY').map((column) => column.column);
    let rowCount = 0;

    for (const targetRow of target.rowList) {
        if (preProcess && !isPreProcessRow(source.sheetNm, targetRow.rowNo)) continue;
        const sourceRow = source.rowList.find((row) => row.rowNo === targetRow.rowNo);
        if (!sourceRow) continue;
        rowCount += 1;

        for (const column of valueColumns) {
            const sourceCell = sourceRow.cellList.find((cell) => cell.column === column);
            const targetCell = targetRow.cellList.find((cell) => cell.column === column);
            if (sourceCell && targetCell) targetCell.value = sourceCell.value;
        }
    }

    return rowCount;
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
        // 서버 ORDER BY 와 같은 순서: 기준정보 → 전처리 결과 → 나머지
        categoryList: structuredClone(CATEGORIES).sort((a, b) => toCategoryOrder(a) - toCategoryOrder(b) || a.fixAtrbGroupId.localeCompare(b.fixAtrbGroupId)),
    }),

    saveCategory: (dto: CastConfigCategorySaveDto): JsonResponse => {
        if ([BASE_CATEGORY_ID, PRE_PRCS_CATEGORY_ID].includes(dto.fixAtrbGroupId)) {
            return { error: true, errorMessage: '예약된 카테고리 코드입니다.' };
        }

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
        if (itemList.some((item) => [BASE_CATEGORY_ID, PRE_PRCS_CATEGORY_ID].includes(item.fixAtrbGroupId))) {
            return { error: true, errorMessage: '기준정보와 전처리 결과는 수정할 수 없습니다.' };
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

    applyOperation: (tmnlId: TmnlId, groupId: string, fixAtrbGroupId: string): JsonResponse => {
        const group = GROUPS.find((item) => item.groupId === groupId);
        if (!group) return { error: true, errorMessage: '시설그룹을 찾지 못했습니다.' };

        if (fixAtrbGroupId === BASE_CATEGORY_ID) {
            return { error: true, errorMessage: '기준정보는 운영 반영 대상이 아닙니다.' };
        }

        const fromPreProcess = fixAtrbGroupId === PRE_PRCS_CATEGORY_ID;
        let totalRowCnt = 0;

        for (const sheetNm of group.sheets) {
            const base = findDataset(tmnlId, BASE_CATEGORY_ID, sheetNm);
            const source = findDataset(tmnlId, fixAtrbGroupId, sheetNm);
            if (!base || !source) continue;

            const valueColumnList = findValueColumns(base);
            const snapshot: MockSnapshot[] = [];
            let aplyRowCnt = 0;

            for (const row of base.rowList) {
                if (fromPreProcess && !isPreProcessRow(sheetNm, row.rowNo)) continue;

                const sourceRow = source.rowList.find((candidate) => candidate.rowNo === row.rowNo);
                if (!sourceRow) continue;

                aplyRowCnt += 1;

                for (const valueColumn of valueColumnList) {
                    const cell = row.cellList.find((candidate) => candidate.column === valueColumn);
                    const sourceCell = sourceRow.cellList.find((candidate) => candidate.column === valueColumn);
                    if (!cell || !sourceCell) continue;

                    snapshot.push({ rowNo: row.rowNo, column: valueColumn, value: cell.value });
                    cell.value = sourceCell.value;
                }
            }

            if (aplyRowCnt === 0) continue;

            totalRowCnt += aplyRowCnt;
            HISTORIES.unshift({
                hstry: {
                    aplySn: ++aplySnSeq,
                    srcFixAtrbGroupId: fixAtrbGroupId,
                    tgtFixAtrbGroupId: BASE_CATEGORY_ID,
                    // 터미널 축이 없는 시트는 서버도 TMNL_ID 를 비워 T1/T2 를 한 순서열로 묶는다
                    tmnlId: sheetNm === CKNCT_TYPE_SHEET ? '' : tmnlId,
                    tblNm: TABLE_BY_SHEET[sheetNm] ?? 'TN_PM_SMLT_PSG_ATRB',
                    sheetNm,
                    aplyRowCnt,
                    cnclYn: 'N',
                    revertableYn: 'Y',
                    frstRegDt: toNowYmdHms(),
                    frstRgtrId: 'PM001',
                },
                terminal: tmnlId,
                snapshot,
            });
        }

        if (totalRowCnt === 0) return { error: true, errorMessage: '반영할 행이 없습니다.' };

        return OK;
    },

    getPreProcessHistory: (tmnlId: TmnlId, sheetNm: string): CastConfigAplyHstryListDto => {
        const activeScopes = new Set<string>();
        const hstryList = HISTORIES.filter(
            (item) => (item.hstry.tmnlId === '' || item.hstry.tmnlId === tmnlId) && (!sheetNm || item.hstry.sheetNm === sheetNm),
        ).map((item) => {
            const scope = `${item.hstry.tmnlId}::${item.hstry.tblNm}`;
            const revertable = !activeScopes.has(scope) && item.hstry.cnclYn === 'N';
            if (revertable) activeScopes.add(scope);
            return { ...item.hstry, revertableYn: revertable ? ('Y' as const) : ('N' as const) };
        });

        return { ...OK, totalCnt: hstryList.length, hstryList: structuredClone(hstryList) };
    },

    revertPreProcess: (aplySn: number): JsonResponse => {
        const entry = HISTORIES.find((item) => item.hstry.aplySn === aplySn);
        if (!entry) return { error: true, errorMessage: '반영 이력을 찾지 못했습니다.' };
        if (entry.hstry.cnclYn === 'Y') return { error: true, errorMessage: '이미 되돌린 이력입니다.' };

        const newer = HISTORIES.find(
            (item) =>
                item.hstry.aplySn > aplySn &&
                item.hstry.tmnlId === entry.hstry.tmnlId &&
                item.hstry.sheetNm === entry.hstry.sheetNm &&
                item.hstry.cnclYn === 'N',
        );
        if (newer) return { error: true, errorMessage: '최신 반영부터 되돌려 주세요.' };

        const base = findDataset(entry.terminal, BASE_CATEGORY_ID, entry.hstry.sheetNm);
        if (!base) return { error: true, errorMessage: '기준정보를 찾지 못했습니다.' };

        for (const item of entry.snapshot) {
            const cell = base.rowList.find((row) => row.rowNo === item.rowNo)?.cellList.find((candidate) => candidate.column === item.column);
            if (cell) cell.value = item.value;
        }

        entry.hstry.cnclYn = 'Y';
        entry.hstry.revertableYn = 'N';

        return OK;
    },

    cloneCategory: (dto: CastConfigCategoryCloneDto): CastConfigCategoryCloneResultDto => {
        const source = CATEGORIES.find((category) => category.fixAtrbGroupId === dto.srcFixAtrbGroupId);
        if (!source) return { ...OK, error: true, errorMessage: '원본 카테고리를 찾지 못했습니다.', fixAtrbGroupId: '' };

        const nextNumber = Array.from({ length: 997 }, (_, index) => index + 2).find(
            (value) => !CATEGORIES.some((category) => category.fixAtrbGroupId === String(value).padStart(3, '0')),
        );
        if (!nextNumber) return { ...OK, error: true, errorMessage: '사용 가능한 카테고리 코드가 없습니다.', fixAtrbGroupId: '' };

        const fixAtrbGroupId = String(nextNumber).padStart(3, '0');
        const now = toNowYmdHms();
        CATEGORIES.push({
            fixAtrbGroupId,
            atrbGroupNm: dto.atrbGroupNm,
            baseYn: 'N',
            prePrcsYn: 'N',
            cfmtnYn: 'N',
            groupPrcsSttsCd: '01',
            frstRegDt: now,
            lastMdfcnDt: now,
        });

        for (const tmnlId of ['T1', 'T2'] as TmnlId[]) {
            const base = DATASETS[tmnlId][BASE_CATEGORY_ID];
            const selected = DATASETS[tmnlId][dto.srcFixAtrbGroupId];
            const created = structuredClone(dto.srcFixAtrbGroupId === PRE_PRCS_CATEGORY_ID ? base : selected);
            if (!created) continue;

            for (const [sheetName, dataset] of Object.entries(created)) created[sheetName] = toEditableDataset(dataset);
            if (dto.srcFixAtrbGroupId === PRE_PRCS_CATEGORY_ID && selected) {
                for (const [sheetName, sourceDataset] of Object.entries(selected)) {
                    const targetDataset = created[sheetName];
                    if (targetDataset) copyDatasetValues(sourceDataset, targetDataset, true);
                }
            }
            DATASETS[tmnlId][fixAtrbGroupId] = created;
        }

        const commonDataset = DATASETS.T1[fixAtrbGroupId]?.[CKNCT_TYPE_SHEET];
        if (commonDataset && DATASETS.T2[fixAtrbGroupId]) DATASETS.T2[fixAtrbGroupId][CKNCT_TYPE_SHEET] = commonDataset;
        return { ...OK, fixAtrbGroupId };
    },

    saveCategorySet: (fixAtrbGroupId: string, itemList: CastConfigSetSaveItemDto[]): JsonResponse => {
        if ([BASE_CATEGORY_ID, PRE_PRCS_CATEGORY_ID].includes(fixAtrbGroupId)) {
            return { error: true, errorMessage: '기준정보와 전처리 결과는 수정할 수 없습니다.' };
        }

        const targets = itemList.map((item) => {
            const group = GROUPS.find((candidate) => candidate.groupId === item.groupId);
            const dataset = findDataset(item.tmnlId, fixAtrbGroupId, item.sheetNm);
            const row = dataset?.rowList.find((candidate) => candidate.rowNo === item.rowNo);
            const cell = row?.cellList.find((candidate) => candidate.column === item.column);
            return { item, valid: Boolean(group?.sheets.includes(item.sheetNm) && cell?.editableYn === 'Y'), cell };
        });
        if (targets.some((target) => !target.valid)) {
            return { error: true, errorMessage: '수정할 수 없는 원본 셀이 포함되어 있습니다.' };
        }

        for (const target of targets) {
            if (target.cell) target.cell.value = target.item.value;
        }
        return OK;
    },

    getCategorySet: (fixAtrbGroupId: string): CastConfigSetDto => {
        const datasetList: CastConfigSetDto['datasetList'] = [];
        const commonSheets = new Set<string>();

        for (const tmnlId of ['T1', 'T2'] as TmnlId[]) {
            for (const group of GROUPS) {
                for (const sheetNm of group.sheets) {
                    const common = sheetNm === CKNCT_TYPE_SHEET;
                    if (common && commonSheets.has(sheetNm)) continue;
                    const dataset = findDataset(tmnlId, fixAtrbGroupId, sheetNm);
                    if (!dataset) continue;
                    if (common) commonSheets.add(sheetNm);
                    datasetList.push({
                        tmnlId: common ? '' : tmnlId,
                        groupId: group.groupId,
                        groupNm: group.groupNm,
                        dataset: structuredClone(dataset),
                    });
                }
            }
        }

        return { ...OK, fixAtrbGroupId, datasetList };
    },

    applyCategorySet: (fixAtrbGroupId: string): JsonResponse => {
        if (fixAtrbGroupId === BASE_CATEGORY_ID) return { error: true, errorMessage: '기준정보는 운영 반영 대상이 아닙니다.' };

        const snapshots: MockSetSnapshot[] = [];
        const detailList: CastConfigAplySetHstryDto['detailList'] = [];
        const visited = new Set<string>();
        let totalRowCount = 0;

        for (const tmnlId of ['T1', 'T2'] as TmnlId[]) {
            for (const group of GROUPS) {
                for (const sheetName of group.sheets) {
                    const common = sheetName === CKNCT_TYPE_SHEET;
                    const scopeKey = `${common ? '공통' : tmnlId}::${sheetName}`;
                    if (visited.has(scopeKey)) continue;
                    visited.add(scopeKey);

                    const target = findDataset(tmnlId, BASE_CATEGORY_ID, sheetName);
                    const source = findDataset(tmnlId, fixAtrbGroupId, sheetName);
                    if (!target || !source) continue;
                    snapshots.push({ terminal: tmnlId, sheetName, dataset: structuredClone(target) });
                    const rowCount = copyDatasetValues(source, target, fixAtrbGroupId === PRE_PRCS_CATEGORY_ID);
                    if (rowCount === 0) continue;
                    totalRowCount += rowCount;
                    detailList.push({
                        aplySn: ++aplySnSeq,
                        tmnlId: common ? '' : tmnlId,
                        groupId: group.groupId,
                        sheetNm: sheetName,
                        aplyRowCnt: rowCount,
                    });
                }
            }
        }

        if (totalRowCount === 0) return { error: true, errorMessage: '반영할 행이 없습니다.' };
        APPLY_SET_HISTORIES.unshift({
            hstry: {
                aplySetSn: ++aplySetSnSeq,
                srcFixAtrbGroupId: fixAtrbGroupId,
                tgtFixAtrbGroupId: BASE_CATEGORY_ID,
                aplyRowCnt: totalRowCount,
                cnclYn: 'N',
                revertableYn: 'Y',
                frstRegDt: toNowYmdHms(),
                frstRgtrId: 'PM001',
                detailList,
            },
            snapshots,
        });
        return OK;
    },

    getApplySetHistory: (): CastConfigAplySetHstryListDto => {
        let foundActive = false;
        const hstryList = APPLY_SET_HISTORIES.map(({ hstry }) => {
            const revertable = !foundActive && hstry.cnclYn === 'N';
            if (revertable) foundActive = true;
            return { ...hstry, revertableYn: revertable ? ('Y' as const) : ('N' as const) };
        });
        return { ...OK, totalCnt: hstryList.length, hstryList: structuredClone(hstryList) };
    },

    revertApplySet: (aplySetSn: number): JsonResponse => {
        const entry = APPLY_SET_HISTORIES.find((item) => item.hstry.aplySetSn === aplySetSn);
        if (!entry) return { error: true, errorMessage: '반영 세트를 찾지 못했습니다.' };
        if (entry.hstry.cnclYn === 'Y') return { error: true, errorMessage: '이미 되돌린 반영 세트입니다.' };
        const latest = APPLY_SET_HISTORIES.find((item) => item.hstry.cnclYn === 'N');
        if (latest !== entry) return { error: true, errorMessage: '최신 반영 세트부터 되돌려 주세요.' };

        for (const snapshot of entry.snapshots) {
            DATASETS[snapshot.terminal][BASE_CATEGORY_ID][snapshot.sheetName] = structuredClone(snapshot.dataset);
        }
        const commonDataset = DATASETS.T1[BASE_CATEGORY_ID][CKNCT_TYPE_SHEET];
        if (commonDataset) DATASETS.T2[BASE_CATEGORY_ID][CKNCT_TYPE_SHEET] = commonDataset;
        entry.hstry.cnclYn = 'Y';
        entry.hstry.revertableYn = 'N';
        return OK;
    },
};
