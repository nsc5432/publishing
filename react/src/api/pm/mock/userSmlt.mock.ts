import { commonMock } from './common.mock';
import type {
    ChknIslandDto,
    FcltType,
    FltPsgChartDto,
    JsonResponse,
    MapMarkerDto,
    SmltKpiDto,
    TmnlId,
    UserSmltChknDto,
    UserSmltDepDto,
    UserSmltDepItemDto,
    UserSmltExecDto,
    UserSmltFcltMapDto,
    UserSmltFltPsgDto,
    UserSmltInfoDto,
    UserSmltQuery,
    UserSmltExecReq,
    UserSmltFltPsgSaveReq,
    UserSmltChknSaveReq,
    UserSmltDepSaveReq,
    SmltExecDetailDto,
    WaitPsgDto,
} from '@/types/api.types';

const OK: JsonResponse = { error: false, errorMessage: '' };

const CHART_TIMES = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];

function toChart(totCnt: number, maxCnt: number, ratios: number[]): FltPsgChartDto {
    return {
        totCnt,
        maxCnt,
        itemList: ratios.map((ratio, i) => ({
            time: CHART_TIMES[i],
            cnt: Math.round((maxCnt * ratio) / 100),
        })),
    };
}

function toHourList(counts: number[]) {
    const pad = (hour: number) => `${String(hour).padStart(2, '0')}00`;

    return counts.map((psgCnt, i) => ({
        bgnTime: pad(4 + i),
        endTime: pad(5 + i),
        psgCnt,
    }));
}

const FLT_PSG: Record<TmnlId, UserSmltFltPsgDto> = {
    T1: {
        ...OK,
        tmnlId: 'T1',
        fltCnt: 15,
        psgCnt: 1234567,
        peakTime: '1400',
        ajmtRt: 10,
        fltChart: toChart(1234, 300, [16, 6, 5, 8, 6, 33, 40, 67, 68, 67, 33, 33]),
        psgChart: toChart(1234567, 90000, [15, 6, 6, 10, 7, 34, 39, 68, 68, 67, 34, 33]),
        hourList: toHourList([12340, 18220, 24510, 31080, 44760, 52300, 61940, 58120, 49870, 55430, 67210, 63050]),
    },
    T2: {
        ...OK,
        tmnlId: 'T2',
        fltCnt: 9,
        psgCnt: 842310,
        peakTime: '1600',
        ajmtRt: 0,
        fltChart: toChart(842, 300, [11, 5, 4, 6, 9, 22, 31, 44, 52, 48, 27, 21]),
        psgChart: toChart(842310, 90000, [12, 4, 5, 7, 10, 23, 30, 45, 53, 47, 26, 20]),
        hourList: toHourList([8120, 11460, 16900, 21340, 29770, 35010, 41220, 39880, 33150, 37600, 45730, 42090]),
    },
};

function toWaitList(counts: number[]): WaitPsgDto[] {
    return counts.map((waitPsgCnt, hour) => ({ hour, waitPsgCnt }));
}

const ISLAND_CD_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

const ALN_CD_LIST: Record<TmnlId, string[]> = {
    T1: ['7C', 'BX', 'KE', 'LJ', 'OZ', 'RS', 'TG', 'TW', 'UA', 'YP', 'ZE'],
    T2: ['AF', 'CI', 'CZ', 'DL', 'GA', 'KE', 'KL', 'MU', 'VN'],
};

type IslandSeed = [string, number, number, string[], number, number];

function toIsland([island, operBgngHour, operEndHour, alnCds, kioskCnt, bagDropCnt]: IslandSeed): ChknIslandDto {
    return {
        island,
        boothCnt: alnCds.length,
        kioskCnt,
        bagDropCnt,
        oprTimeList: [{ operBgngHour, operEndHour }],
        boothList: alnCds.map((alnCd, i) => ({ boothNo: i + 1, alnCd, cstmAltmntYn: 'N' })),
    };
}

const NA = '';

const CHKN_ISLANDS: Record<TmnlId, IslandSeed[]> = {
    T1: [
        ['A', 5, 22, ['KE', 'KE', 'KE', 'KE', 'OZ', 'OZ', 'OZ', NA], 2, 2],
        ['B', 6, 20, ['KE', 'KE', 'KE', 'OZ', 'OZ', NA], 2, 1],
        ['C', 7, 19, ['OZ', 'OZ', 'KE', NA], 1, 1],
        ['D', 9, 17, ['OZ', 'OZ', 'OZ', 'KE', 'KE', NA], 2, 1],
        ['E', 11, 15, ['KE', 'KE', NA], 1, 1],
        ['F', 13, 15, ['OZ', NA, NA], 0, 0],
    ],
    T2: [
        ['A', 5, 21, ['KE', 'KE', 'KE', 'KE', 'OZ', NA], 2, 1],
        ['B', 7, 19, ['KE', 'KE', 'OZ', NA], 2, 1],
        ['C', 10, 16, ['KE', 'OZ', NA], 1, 1],
    ],
};

const CHKN_WAIT: Record<TmnlId, number[]> = {
    T1: [0, 0, 0, 0, 0, 40, 120, 230, 340, 300, 250, 280, 320, 360, 300, 240, 200, 170, 140, 100, 60, 20, 0, 0],
    T2: [0, 0, 0, 0, 0, 20, 60, 110, 150, 130, 110, 120, 140, 160, 130, 100, 80, 60, 45, 30, 15, 5, 0, 0],
};

const CHKN_KPI: Record<TmnlId, SmltKpiDto> = {
    T1: { avgWaitMin: 15, p95WaitMin: 12, maxQueuePsgCnt: 20, utilRate: 84 },
    T2: { avgWaitMin: 9, p95WaitMin: 7, maxQueuePsgCnt: 11, utilRate: 61 },
};

function peakCounterCnt(islands: ChknIslandDto[]): number {
    const byHour: number[] = Array(24).fill(0);

    islands.forEach((island) => {
        island.oprTimeList.forEach(({ operBgngHour, operEndHour }) => {
            for (let hour = operBgngHour; hour < operEndHour; hour += 1) byHour[hour] += island.boothCnt;
        });
    });

    return Math.max(0, ...byHour);
}

function buildChkn(tmnlId: TmnlId): UserSmltChknDto {
    const islandList = CHKN_ISLANDS[tmnlId].map(toIsland);
    const sum = (pick: (island: ChknIslandDto) => number) => islandList.reduce((total, island) => total + pick(island), 0);

    return {
        ...OK,
        tmnlId,
        totCnt: 36,
        peakCounterCnt: peakCounterCnt(islandList),
        totKioskCnt: sum((island) => island.kioskCnt),
        totBagDropCnt: sum((island) => island.bagDropCnt),
        waitMaxCnt: 400,
        islandCdList: ISLAND_CD_LIST,
        alnCdList: ALN_CD_LIST[tmnlId],
        islandList,
        waitList: toWaitList(CHKN_WAIT[tmnlId]),
        kpi: CHKN_KPI[tmnlId],
    };
}

type DepSeed = [string, number, number, boolean, number, number, number];

function toDptgt([dptgtNo, operBgngHour, operEndHour, off, scshCntom, gnrlSrchCntom, smartPassSrchCntom]: DepSeed): UserSmltDepItemDto {
    return {
        dptgtNo,
        dptgtNm: `출국장 ${dptgtNo}`,
        oprYn: off ? 'N' : 'Y',
        scshCntom,
        gnrlSrchCntom,
        smartPassSrchCntom,
        oprTimeList: [{ operBgngHour, operEndHour }],
    };
}

const DPTGT_GATES: Record<TmnlId, DepSeed[]> = {
    T1: [
        ['1', 5, 18, false, 8, 3, 2],
        ['2', 6, 21, true, 6, 2, 1],
        ['3', 6, 21, false, 6, 2, 2],
        ['4', 6, 20, false, 10, 3, 2],
        ['5', 7, 20, true, 4, 2, 1],
        ['6', 7, 19, false, 4, 2, 1],
    ],
    T2: [
        ['1', 7, 21, false, 5, 3, 1],
        ['2', 7, 20, true, 4, 2, 1],
    ],
};

const DPTGT_WAIT: Record<TmnlId, number[]> = {
    T1: [0, 0, 0, 0, 0, 25, 90, 180, 260, 230, 190, 210, 240, 270, 220, 180, 150, 120, 95, 65, 35, 12, 0, 0],
    T2: [0, 0, 0, 0, 0, 0, 0, 30, 55, 48, 40, 44, 50, 58, 47, 38, 30, 24, 18, 12, 6, 0, 0, 0],
};

const DPTGT_KPI: Record<TmnlId, SmltKpiDto> = {
    T1: { avgWaitMin: 15, p95WaitMin: 12, maxQueuePsgCnt: 20, utilRate: 84 },
    T2: { avgWaitMin: 6, p95WaitMin: 5, maxQueuePsgCnt: 8, utilRate: 47 },
};

function peakScshCntom(dptgtList: UserSmltDepItemDto[]): number {
    const byHour: number[] = Array(24).fill(0);

    dptgtList
        .filter((dep) => dep.oprYn === 'Y')
        .forEach((dep) => {
            dep.oprTimeList.forEach((time) => {
                for (let hour = time.operBgngHour; hour < time.operEndHour; hour += 1) {
                    byHour[hour] += dep.scshCntom;
                }
            });
        });

    return Math.max(0, ...byHour);
}

function buildDep(tmnlId: TmnlId): UserSmltDepDto {
    const dptgtList = DPTGT_GATES[tmnlId].map(toDptgt);

    return {
        ...OK,
        tmnlId,
        peakScshCntom: peakScshCntom(dptgtList),
        waitMaxCnt: 300,
        dptgtList,
        waitList: toWaitList(DPTGT_WAIT[tmnlId]),
        kpi: DPTGT_KPI[tmnlId],
    };
}

const CHKN_MARKERS: Array<[string, number, number]> = [
    ['N', 19.21, 90.68],
    ['M', 22.93, 87.19],
    ['L', 27.16, 82.46],
    ['K', 31.94, 78.79],
    ['J', 36.55, 76.02],
    ['H', 41.94, 74.23],
    ['G', 53.18, 73.34],
    ['F', 58.12, 74.23],
    ['E', 63.07, 76.02],
    ['D', 67.91, 78.52],
    ['C', 72.8, 82.19],
    ['B', 77.14, 86.3],
    ['A', 80.75, 90.68],
];

const DPTGT_MARKERS: Record<TmnlId, Array<[string, number, number]>> = {
    T1: [
        ['6', 16.65, 79.59],
        ['5', 27.16, 69.76],
        ['4', 38.22, 63.5],
        ['3', 61.68, 63.5],
        ['2', 72.69, 69.76],
        ['1', 82.87, 79.59],
    ],
    T2: [
        ['2', 36.95, 68.62],
        ['1', 63.05, 68.62],
    ],
};

function toMarkerList(tmnlId: TmnlId, fcltType: FcltType, island: string): MapMarkerDto[] {
    const seeds = fcltType === 'CHKN' || fcltType === 'SLFCHKN' ? CHKN_MARKERS : DPTGT_MARKERS[tmnlId];

    return seeds
        .filter(([label]) => !island || label === island)
        .map(([label, cdntX, cdntY]) => ({
            markerId: fcltType === 'CHKN' || fcltType === 'SLFCHKN' ? label : `dg${label}`,
            label,
            cdntX,
            cdntY,
        }));
}

interface Conditions {
    flt: UserSmltFltPsgDto;
    chkn: UserSmltChknDto;
    dep: UserSmltDepDto;
}
interface SavedCondition<T> {
    value: T;
    saveDt: string;
}
interface CurrentConditions {
    flt?: SavedCondition<UserSmltFltPsgDto>;
    chkn?: SavedCondition<UserSmltChknDto>;
    dep?: SavedCondition<UserSmltDepDto>;
}
interface Execution {
    detail: SmltExecDetailDto;
    rgtrId: string;
    requestedDt: string;
    resourceIds: Record<TmnlId, string>;
}
const current = new Map<string, CurrentConditions>();
export const mockExecutions = new Map<string, Execution>();
export const mockResources = new Map<string, Conditions>();
let nextId = 10000000;
const stamp = () => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((value, index) => String(value).padStart(index === 0 ? 4 : 2, '0'))
        .join('');
};
const key = (ymd: string, terminal: TmnlId) => [commonMock.getUserInfoBySession().userId, ymd, terminal].join(':');
function defaults(terminal: TmnlId): Conditions {
    return { flt: { ...structuredClone(FLT_PSG[terminal]), ajmtRt: 0 }, chkn: buildChkn(terminal), dep: buildDep(terminal) };
}
function currentConditions(state: Map<string, CurrentConditions>, ymd: string, terminal: TmnlId): Conditions {
    const saved = state.get(key(ymd, terminal));
    const base = defaults(terminal);
    return structuredClone({
        flt: saved?.flt?.value ?? base.flt,
        chkn: saved?.chkn?.value ?? base.chkn,
        dep: saved?.dep?.value ?? base.dep,
    });
}
function conditions(query: UserSmltQuery, terminal: TmnlId): Conditions {
    if (query.smltId) {
        const execution = mockExecutions.get(query.smltId);
        if (!execution) throw new Error('해당 실행의 리소스 참조가 없습니다.');
        const resource = mockResources.get(execution.resourceIds[terminal]);
        if (!resource) throw new Error('참조한 리소스가 없습니다.');
        return structuredClone(resource);
    }
    return currentConditions(current, query.ymd, terminal);
}
function validateYmd(ymd: string): void {
    const iso = ymd.slice(0, 4) + '-' + ymd.slice(4, 6) + '-' + ymd.slice(6, 8);
    const date = new Date(iso + 'T00:00:00Z');
    if (!/^\d{8}$/.test(ymd) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) throw new Error('대상 일자를 확인해주세요.');
}
function saveFlt(request: UserSmltFltPsgSaveReq, state: Map<string, CurrentConditions>) {
    validateYmd(request.ymd);
    const id = key(request.ymd, request.tmnlId);
    const value = structuredClone(state.get(id) ?? {});
    if (!Number.isFinite(request.ajmtRt) || request.ajmtRt < -100 || request.ajmtRt > 100) throw new Error('수정 비율은 -100 ~ 100 사이여야 합니다.');
    value.flt = { value: { ...defaults(request.tmnlId).flt, ajmtRt: request.ajmtRt }, saveDt: stamp() };
    state.set(id, value);
}
function saveChkn(request: UserSmltChknSaveReq, state: Map<string, CurrentConditions>) {
    validateYmd(request.ymd);
    const id = key(request.ymd, request.tmnlId);
    const value = structuredClone(state.get(id) ?? {});
    const chkn = defaults(request.tmnlId).chkn;
    chkn.islandList = structuredClone(request.islandList).map((island) => ({
        ...island,
        boothCnt: island.boothList.filter((booth) => booth.alnCd).length,
    }));
    if (chkn.islandList.length > 0) value.chkn = { value: chkn, saveDt: stamp() };
    else delete value.chkn;
    state.set(id, value);
}
function saveDep(request: UserSmltDepSaveReq, state: Map<string, CurrentConditions>) {
    validateYmd(request.ymd);
    const id = key(request.ymd, request.tmnlId);
    const value = structuredClone(state.get(id) ?? {});
    const dep = defaults(request.tmnlId).dep;
    dep.dptgtList = structuredClone(request.dptgtList).map((gate) => ({ ...gate, dptgtNm: '출국장 ' + gate.dptgtNo }));
    dep.peakScshCntom = peakScshCntom(dep.dptgtList);
    if (dep.dptgtList.length > 0) value.dep = { value: dep, saveDt: stamp() };
    else delete value.dep;
    state.set(id, value);
}
function publishResources(id: string, values: Record<TmnlId, Conditions>): Record<TmnlId, string> {
    return Object.fromEntries(
        (['T1', 'T2'] as const).map((terminal) => {
            const resourceId = `${id}:${terminal}`;
            if (mockResources.has(resourceId)) throw new Error('이미 지정된 리소스입니다.');
            const resource = structuredClone(values[terminal]);
            const factor = 1 + resource.flt.ajmtRt / 100;
            resource.flt.hourList.forEach((hour) => {
                hour.psgCnt = Math.round(hour.psgCnt * factor);
            });
            resource.flt.psgCnt = resource.flt.hourList.reduce((sum, hour) => sum + hour.psgCnt, 0);
            resource.flt.psgChart.itemList.forEach((item) => {
                item.cnt = resource.flt.hourList
                    .filter((hour) => Number(hour.bgnTime.slice(0, 2)) >= Number(item.time) && Number(hour.bgnTime.slice(0, 2)) < Number(item.time) + 2)
                    .reduce((sum, hour) => sum + hour.psgCnt, 0);
            });
            resource.flt.psgChart.totCnt = resource.flt.psgCnt;
            resource.flt.psgChart.maxCnt = Math.max(0, ...resource.flt.psgChart.itemList.map((item) => item.cnt));
            resource.flt.peakTime =
                resource.flt.hourList.reduce((peak, hour) => (hour.psgCnt > peak.psgCnt ? hour : peak), resource.flt.hourList[0])?.bgnTime ?? '0000';
            resource.flt.ajmtRt = 0;
            resource.chkn.islandList = resource.chkn.islandList
                .filter((island) => island.oprTimeList.length > 0)
                .map((island) => ({
                    ...island,
                    boothList: island.boothList.filter((booth) => booth.alnCd),
                }));
            resource.dep.dptgtList = resource.dep.dptgtList.filter((gate) => gate.oprYn === 'Y' && gate.oprTimeList.length > 0);
            mockResources.set(resourceId, resource);
            return [terminal, resourceId];
        }),
    ) as Record<TmnlId, string>;
}
export function seedExecution(detail: SmltExecDetailDto, rgtrId: string, requestedDt = detail.smltFlfmtBgngDt): void {
    if (mockExecutions.has(detail.smltId)) return;
    mockExecutions.set(detail.smltId, {
        detail: structuredClone(detail),
        rgtrId,
        requestedDt,
        resourceIds: publishResources(detail.smltId, { T1: defaults('T1'), T2: defaults('T2') }),
    });
}
export const userSmltMock = {
    getInfo: (ymd: string, tmnlId: TmnlId): UserSmltInfoDto => ({
        ...OK,
        ymd,
        saveDt: Object.values(current.get(key(ymd, tmnlId)) ?? {}).map((area) => area.saveDt).sort().at(-1) ?? '',
        smltFlfmtSttsCd: '',
    }),
    getFltPsgInfo: (query: UserSmltQuery, tmnlId: TmnlId) => conditions(query, tmnlId).flt,
    getChknCounterInfo: (query: UserSmltQuery, tmnlId: TmnlId) => conditions(query, tmnlId).chkn,
    getDepInfo: (query: UserSmltQuery, tmnlId: TmnlId) => conditions(query, tmnlId).dep,
    getFcltMap: (tmnlId: TmnlId, fcltType: FcltType, island = ''): UserSmltFcltMapDto => ({
        ...OK,
        tmnlId,
        fcltType,
        island,
        markerList: toMarkerList(tmnlId, fcltType, island),
    }),
    saveFltPsgInfo: (request: UserSmltFltPsgSaveReq): JsonResponse => {
        saveFlt(request, current);
        return { ...OK };
    },
    saveChknCounterInfo: (request: UserSmltChknSaveReq): JsonResponse => {
        saveChkn(request, current);
        return { ...OK };
    },
    saveDepInfo: (request: UserSmltDepSaveReq): JsonResponse => {
        saveDep(request, current);
        return { ...OK };
    },
    execute: (request: UserSmltExecReq): UserSmltExecDto => {
        validateYmd(request.ymd);
        for (const edits of [request.fltPsgList, request.chknList, request.depList]) {
            if (new Set(edits.map((edit) => edit.tmnlId)).size !== edits.length) throw new Error('변경 영역의 터미널이 중복됐습니다.');
        }
        const staged = new Map(current);
        request.fltPsgList.forEach((item) => saveFlt({ ...item, ymd: request.ymd }, staged));
        request.chknList.forEach((item) => saveChkn({ ...item, ymd: request.ymd }, staged));
        request.depList.forEach((item) => saveDep({ ...item, ymd: request.ymd }, staged));
        const resolved = Object.fromEntries(
            (['T1', 'T2'] as const).map((terminal) => [terminal, currentConditions(staged, request.ymd, terminal)]),
        ) as Record<TmnlId, Conditions>;
        const smltId = String(++nextId);
        const user = commonMock.getUserInfoBySession();
        mockExecutions.set(smltId, {
            rgtrId: user.userId,
            resourceIds: publishResources(smltId, resolved),
            requestedDt: stamp(),
            detail: {
                ...OK,
                smltId,
                smltType: 'USER',
                ymd: request.ymd,
                tmnlId: 'T1',
                deptNm: user.deptNm,
                userNm: user.userNm,
                smltFlfmtBgngDt: '',
                smltFlfmtEndDt: '',
                execMin: 0,
                smltFlfmtSttsCd: 'WAITING',
            },
        });
        staged.forEach((value, id) => current.set(id, value));
        return { ...OK, smltId, smltReqId: 'WI' + smltId, smltFlfmtSttsCd: 'WAITING', smltFlfmtBgngDt: '' };
    },
};
