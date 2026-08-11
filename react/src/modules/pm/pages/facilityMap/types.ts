import type { FcltType } from '@/types/api.types';

/**
 * 시설물 매핑 화면 뷰 모델.
 *
 * 이 화면은 읽기전용이다. 매핑을 고치는 상태는 없고, "제대로 매핑돼 있는지"를
 * 가려내는 상태(MappingStatus)만 있다.
 */

export type { TerminalKind } from '@/modules/pm/types/map.types';
export { TERMINAL_LABEL, TERMINALS } from '@/modules/pm/types/map.types';

/* ================= 매핑 상태 ================= */

/**
 * 매핑 상태 — 이 화면이 확인하려는 것 그 자체.
 *
 *  mapped   : CAST 시설과 짝이 맞고 운영 중 (정상)
 *  unmapped : CAST 쪽 짝이 없다 (smltFcltNm 이 비어 있다)
 *  unused   : 매핑은 있으나 운영에서 내렸다 (useYn = 'N')
 *
 * 한 시설이 미매핑이면서 미사용일 수 있다. 그때는 더 위험한 쪽(unmapped)으로 센다.
 */
export type MappingStatus = 'mapped' | 'unmapped' | 'unused';

export const MAPPING_STATUS_LABEL: Record<MappingStatus, string> = {
    mapped: '정상',
    unmapped: '미매핑',
    unused: '미사용',
};

/** 표·타일에서 함께 쓰는 필터 값 (all = 전체) */
export type StatusFilter = MappingStatus | 'all';

/** 상단 요약 타일 1개 */
export interface StatusTile {
    key: StatusFilter;
    label: string;
    count: number;
}

/* ================= 목록 ================= */

/** 매핑 표 1행 */
export interface FcltMapRow {
    /** 여객시설코드 (PK) — 행 key */
    code: string;
    /** 시설그룹 표시명 (예: 체크인카운터) */
    groupName: string;
    /** 시설그룹 코드 — 그룹 필터 값 */
    groupCode: string;
    /** 여객시설명 */
    name: string;
    /** 여객시설설명 */
    desc: string;
    /** 시뮬레이션시설명 (CAST) — 미매핑이면 '' . 사용자가 고칠 수 있는 유일한 값 */
    castName: string;
    fcltType: FcltType;
    /** 도면 마커 id — 마커와 이어 주는 키, 없으면 '' */
    markerId: string;
    /** 운영 중인지 (useYn = 'Y') — 편집 후 상태를 다시 판정할 때 쓴다 */
    inUse: boolean;
    status: MappingStatus;
    /** 최종수정 표기 (예: 2026-03-11 kim.ic) */
    modified: string;
}

/**
 * 아직 저장하지 않은 CAST 시뮬레이션명 (여객시설코드 → 새 값).
 * 바꾼 시설만 담는다 — 원래 값으로 되돌리면 항목 자체를 뺀다.
 */
export type CastDrafts = Record<string, string>;

/** 시설그룹 필터 항목 */
export interface FcltGroup {
    code: string;
    name: string;
    count: number;
}

/* ================= 도면 ================= */

/** 도면 마커 1개 — 그 구역에 걸린 시설 건수를 함께 들고 있다 */
export interface FcltMarker {
    id: string;
    label: string;
    x: number;
    y: number;
    /** 마커 모양 — 아일랜드(사각) / 출국장(세로 막대) */
    kind: 'island' | 'depGate';
    /** 이 구역의 시설 건수 */
    total: number;
    /** 이 구역의 미매핑 건수 — 0 보다 크면 도면에서 바로 보여야 한다 */
    unmapped: number;
}

/** 화면 한 벌 */
export interface FacilityMapData {
    /** .map__bg 무대 가로세로 비율 (CSS aspect-ratio 값) */
    stageAspect: string;
    rows: FcltMapRow[];
    groups: FcltGroup[];
    markers: FcltMarker[];
    tiles: StatusTile[];
}

/** 시설유형 표기 — 표의 유형 점 툴팁과 상세 바에서 쓴다 */
export const FCLT_TYPE_LABEL: Record<FcltType, string> = {
    CHKN: '체크인카운터',
    SLFCHKN: '셀프체크인/백드롭',
    DEP: '출국장',
    SC: '보안검색대',
    CMRC: '상업시설',
};
