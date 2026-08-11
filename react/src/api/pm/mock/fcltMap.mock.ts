import type {
    FcltMapItemDto,
    FcltMapListDto,
    FcltMapSaveItemDto,
    FcltType,
    JsonResponse,
    MapMarkerDto,
    TmnlId,
} from '@/types/api.types';

/**
 * 시설물 매핑 목업.
 *
 * 실제 원본은 TN_PM_SMLT_PSG_FCLT 한 테이블이다. 여기서는 그 테이블이
 * 어떤 모양으로 내려올지를 흉내 내되, 화면이 확인하려는 이상 케이스
 * (미매핑 / 미사용)를 반드시 몇 건 섞어 둔다. 전부 정상인 데이터로는
 * 이 화면이 제 일을 하는지 확인할 수 없다.
 */

/**
 * 도면 마커 좌표 — 아일랜드 (도면 무대 기준 비율 %).
 *
 * 이 화면은 흐림 필터가 없는 도면(terminal1/2-plan-solid.svg)을 쓴다. 좌표는 그 도면
 * 기준으로 맞춰 두었다 — 마커가 건물 밖 빈 자리에 떠 있으면 배치를 확인할 수 없다.
 *
 * T1 은 기존 화면(맵형태보기 · 사용자 시뮬레이션)이 쓰는 값 그대로도 건물 위에 얹힌다.
 * T2 는 도면 모양이 아주 달라(가운데가 파인 형태, 콘코스 아래 가장자리가 y≈44%)
 * 기존 값을 쓰면 마커가 건물 아래로 내려가므로 여기서 다시 잡았다.
 */
const ISLAND_POINTS: Record<TmnlId, Record<string, [number, number]>> = {
    T1: {
        N: [19.21, 90.68],
        M: [22.93, 87.19],
        L: [27.16, 82.46],
        K: [31.94, 78.79],
        J: [36.55, 76.02],
        H: [41.94, 74.23],
        G: [53.18, 73.34],
        F: [58.12, 74.23],
        E: [63.07, 76.02],
        D: [67.91, 78.52],
        C: [72.8, 82.19],
        B: [77.14, 86.3],
        A: [80.75, 90.68],
    },
    T2: {
        N: [17.0, 46.0],
        M: [22.5, 42.5],
        L: [28.0, 40.5],
        K: [33.5, 39.5],
        J: [39.0, 39.0],
        H: [44.5, 38.8],
        G: [50.0, 38.8],
        F: [55.5, 38.8],
        E: [61.0, 39.0],
        D: [66.5, 39.5],
        C: [72.0, 40.5],
        B: [77.5, 42.5],
        A: [83.0, 46.0],
    },
};

/** 도면 마커 좌표 — 출국장 */
const DEP_POINTS: Record<TmnlId, Record<string, [number, number]>> = {
    T1: {
        '6': [16.65, 79.59],
        '5': [27.16, 69.76],
        '4': [38.22, 63.5],
        '3': [61.68, 63.5],
        '2': [72.69, 69.76],
        '1': [82.87, 79.59],
    },
    T2: {
        '2': [38.0, 30.0],
        '1': [62.0, 30.0],
    },
};

/** 아일랜드 (서편 → 동편 순). 두 터미널 모두 A~N 13곳이고 I 는 쓰지 않는다 */
const ISLAND_CODES = ['N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

const ISLANDS: Record<TmnlId, string[]> = {
    T1: ISLAND_CODES,
    T2: ISLAND_CODES,
};

/** 셀프체크인/백드롭이 놓인 아일랜드 */
const SELF_ISLANDS: Record<TmnlId, string[]> = {
    T1: ['M', 'K', 'J', 'F', 'D', 'B'],
    T2: ['L', 'J', 'H', 'F', 'D', 'B'],
};

/** 상업시설 배치 (아일랜드, 시설명) */
const STORES: Record<TmnlId, Array<[string, string]>> = {
    T1: [
        ['N', '면세점 서편'],
        ['L', '식음료 존 1'],
        ['J', '편의점 J'],
        ['H', '환전소 중앙'],
        ['G', '면세점 중앙'],
        ['E', '식음료 존 2'],
        ['C', '편의점 C'],
        ['A', '면세점 동편'],
    ],
    T2: [
        ['M', '면세점 서편'],
        ['K', '식음료 존 1'],
        ['H', '환전소 중앙'],
        ['G', '면세점 중앙'],
        ['E', '편의점 E'],
        ['C', '식음료 존 2'],
        ['B', '면세점 동편'],
    ],
};

/** 시설그룹 (상위여객시설코드) — 코드 접두사와 표시명 */
const GROUPS: Array<{ suffix: string; name: string; fcltType: FcltType }> = [
    { suffix: 'CHK', name: '체크인카운터', fcltType: 'CHKN' },
    { suffix: 'SLF', name: '셀프체크인/백드롭', fcltType: 'SLFCHKN' },
    { suffix: 'DEP', name: '출국장', fcltType: 'DEP' },
    { suffix: 'SEC', name: '보안검색대', fcltType: 'SC' },
    { suffix: 'CMR', name: '상업시설', fcltType: 'CMRC' },
];

const GROUP_BY_SUFFIX = new Map(GROUPS.map((group) => [group.suffix, group]));

/**
 * 매핑이 빠졌거나 운영에서 내린 시설 (여객시설코드 기준).
 * 화면의 "미매핑 / 미사용" 필터가 실제로 걸리는지 보려면 고정된 예외가 있어야 한다.
 */
const UNMAPPED = new Set(['T1CHKJ02', 'T1CMR03', 'T1SECdg5', 'T2CHKF02', 'T2CMR04']);
const UNUSED = new Set(['T1CHKN02', 'T1SLFB01', 'T2CHKC02']);

const MODIFIERS = ['kim.ic', 'park.ic', 'lee.ic', 'choi.ic'];

/** 여객시설코드에서 되풀이되는 최종수정 이력을 만든다 (목업이라 값이 흔들리면 안 된다) */
function toAudit(psgFcltCd: string, index: number) {
    const day = 10 + (index % 18);
    return {
        lastMdfrId: MODIFIERS[psgFcltCd.length % MODIFIERS.length],
        lastMdfcnDt: `2026${String(3 + (index % 5)).padStart(2, '0')}${String(day).padStart(2, '0')}143000`,
    };
}

interface ItemSeed {
    psgFcltCd: string;
    psgFcltNm: string;
    psgFcltExpln: string;
    smltFcltNm: string;
    island: string;
    groupSuffix: string;
}

/** 터미널 한 곳의 시설 목록을 만든다 (그룹 순서 = 화면 기본 정렬 순서) */
function toItemSeeds(tmnlId: TmnlId): ItemSeed[] {
    const seeds: ItemSeed[] = [];

    // 체크인카운터 — 아일랜드마다 카운터 2구간
    for (const island of ISLANDS[tmnlId]) {
        for (const seq of ['01', '02']) {
            seeds.push({
                psgFcltCd: `${tmnlId}CHK${island}${seq}`,
                psgFcltNm: `${island} 아일랜드 ${Number(seq)}구간`,
                psgFcltExpln: `${island}아일랜드 ${seq === '01' ? '좌측' : '우측'} 카운터`,
                smltFcltNm: `CHK_${island}_${seq}`,
                island,
                groupSuffix: 'CHK',
            });
        }
    }

    // 셀프체크인/백드롭
    for (const island of SELF_ISLANDS[tmnlId]) {
        seeds.push({
            psgFcltCd: `${tmnlId}SLF${island}01`,
            psgFcltNm: `${island} 셀프체크인`,
            psgFcltExpln: `${island}아일랜드 셀프체크인/백드롭`,
            smltFcltNm: `SLF_${island}_01`,
            island,
            groupSuffix: 'SLF',
        });
    }

    // 출국장 / 보안검색대 — 둘 다 출국장 마커에 붙는다
    for (const depNum of Object.keys(DEP_POINTS[tmnlId])) {
        seeds.push({
            psgFcltCd: `${tmnlId}DEP0${depNum}`,
            psgFcltNm: `${depNum}번 출국장`,
            psgFcltExpln: `출국장 ${depNum} 게이트`,
            smltFcltNm: `DEP_0${depNum}`,
            island: `dg${depNum}`,
            groupSuffix: 'DEP',
        });
        seeds.push({
            psgFcltCd: `${tmnlId}SECdg${depNum}`,
            psgFcltNm: `${depNum}번 보안검색대`,
            psgFcltExpln: `출국장 ${depNum} 보안검색`,
            smltFcltNm: `SEC_0${depNum}`,
            island: `dg${depNum}`,
            groupSuffix: 'SEC',
        });
    }

    // 상업시설
    STORES[tmnlId].forEach(([island, name], index) => {
        const seq = String(index + 1).padStart(2, '0');
        seeds.push({
            psgFcltCd: `${tmnlId}CMR${seq}`,
            psgFcltNm: name,
            psgFcltExpln: `${island}아일랜드 인근 상업시설`,
            smltFcltNm: `CMR_${seq}`,
            island,
            groupSuffix: 'CMR',
        });
    });

    return seeds;
}

function toItemList(tmnlId: TmnlId): FcltMapItemDto[] {
    return toItemSeeds(tmnlId).map((seed, index) => {
        const group = GROUP_BY_SUFFIX.get(seed.groupSuffix);

        return {
            psgFcltCd: seed.psgFcltCd,
            upPsgFcltCd: `${tmnlId}${seed.groupSuffix}`,
            upPsgFcltNm: group?.name ?? '',
            psgFcltNm: seed.psgFcltNm,
            psgFcltExpln: seed.psgFcltExpln,
            // 미매핑 시설은 CAST 쪽 짝이 없다 — 빈 문자열로 내려온다
            smltFcltNm: UNMAPPED.has(seed.psgFcltCd) ? '' : seed.smltFcltNm,
            tmnlId,
            fcltType: group?.fcltType ?? 'CHKN',
            island: seed.island,
            sortSeq: index + 1,
            useYn: UNUSED.has(seed.psgFcltCd) ? 'N' : 'Y',
            ...toAudit(seed.psgFcltCd, index),
        };
    });
}

function toMarkerList(tmnlId: TmnlId): MapMarkerDto[] {
    const islands: MapMarkerDto[] = ISLANDS[tmnlId].map((island) => ({
        markerId: island,
        label: island,
        cdntX: ISLAND_POINTS[tmnlId][island][0],
        cdntY: ISLAND_POINTS[tmnlId][island][1],
    }));

    const depGates: MapMarkerDto[] = Object.entries(DEP_POINTS[tmnlId]).map(([depNum, point]) => ({
        markerId: `dg${depNum}`,
        label: depNum,
        cdntX: point[0],
        cdntY: point[1],
    }));

    return [...islands, ...depGates];
}

/**
 * 저장된 매핑 (여객시설코드 → 시뮬레이션시설명).
 *
 * 목업이 상태를 안 들고 있으면 저장 버튼을 눌러도 다시 조회했을 때 옛 값이 돌아와,
 * "저장이 실제로 반영되는가"를 화면에서 확인할 수 없다. 새로고침하면 초기화된다.
 */
const savedNames = new Map<string, string>();

export const fcltMapMock = {
    getFcltMapList: (tmnlId: TmnlId): FcltMapListDto => ({
        error: false,
        errorMessage: '',
        tmnlId,
        itemList: toItemList(tmnlId).map((item) =>
            savedNames.has(item.psgFcltCd)
                ? {
                      ...item,
                      smltFcltNm: savedNames.get(item.psgFcltCd) as string,
                      lastMdfrId: 'me.ic',
                      lastMdfcnDt: '20260812093000',
                  }
                : item,
        ),
        markerList: toMarkerList(tmnlId),
    }),

    saveFcltMapList: (_tmnlId: TmnlId, itemList: FcltMapSaveItemDto[]): JsonResponse => {
        for (const item of itemList) {
            savedNames.set(item.psgFcltCd, item.smltFcltNm);
        }

        return { error: false, errorMessage: '' };
    },
};
