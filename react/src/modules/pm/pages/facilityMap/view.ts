import { formatYmd } from '@/lib/format';
import type { FcltMapItemDto, FcltMapListDto, MapMarkerDto } from '@/types/api.types';
import {
    MAPPING_STATUS_LABEL,
    type CastDrafts,
    type FacilityMapData,
    type FcltGroup,
    type FcltMapRow,
    type FcltMarker,
    type MappingStatus,
    type StatusTile,
} from './types';

/**
 * 시설물 매핑 DTO → 화면 표기.
 *
 * 매핑 상태 판정과 건수 집계를 여기 한 곳에 모은다. 표·타일·도면 마커가
 * 각자 판정하면 "표에서는 미매핑 3건인데 타일은 4건" 같은 어긋남이 생긴다.
 */

/**
 * 도면 무대(.map__bg) 가로세로 비율.
 * 도면 SVG 의 viewBox 에서 온 값이라 데이터가 아니라 화면 자산에 속한다.
 * 맵형태보기(terminalMap/view.ts)와 같은 값이어야 마커가 같은 자리에 얹힌다.
 */
const STAGE_ASPECT = '1798.6 / 1118.7';

/** 출국장 마커 id 접두사 — 서버 마커와 시설의 island 값이 공유하는 규칙 */
const DPTGT_GATE_PREFIX = 'dg';

/**
 * 매핑 상태 판정.
 * 미매핑과 미사용이 겹치면 미매핑으로 센다 — 운영에서 내린 시설보다
 * 짝이 없는 시설이 먼저 손봐야 할 문제다.
 *
 * 값만 받는다 — 편집 중인 초안에도 같은 잣대를 대야 하기 때문이다.
 * (CAST명을 채우는 순간 표의 상태 뱃지와 상단 타일이 함께 움직인다)
 */
export function toMappingStatus(castName: string, inUse: boolean): MappingStatus {
    if (!castName) return 'unmapped';
    if (!inUse) return 'unused';

    return 'mapped';
}

/** 최종수정 표기 (예: 2026-03-11 kim.ic) — 값이 없으면 '-' */
function toModified(item: FcltMapItemDto): string {
    if (!item.lastMdfcnDt) return '-';

    return `${formatYmd(item.lastMdfcnDt.slice(0, 8), '-')} ${item.lastMdfrId}`.trim();
}

function toFcltMapRow(item: FcltMapItemDto): FcltMapRow {
    const inUse = item.useYn === 'Y';

    return {
        code: item.psgFcltCd,
        groupName: item.upPsgFcltNm,
        groupCode: item.upPsgFcltCd,
        name: item.psgFcltNm,
        desc: item.psgFcltExpln,
        castName: item.smltFcltNm,
        fcltType: item.fcltType,
        markerId: item.island,
        inUse,
        status: toMappingStatus(item.smltFcltNm, inUse),
        modified: toModified(item),
    };
}

/**
 * 편집 중인 CAST명을 얹은 목록.
 *
 * 서버가 준 행은 그대로 두고 여기서 덧씌운다 — 원본이 남아 있어야
 * "되돌리기"와 "무엇이 바뀌었나"를 값 비교만으로 알 수 있다.
 */
export function applyCastDrafts(rows: FcltMapRow[], drafts: CastDrafts): FcltMapRow[] {
    if (Object.keys(drafts).length === 0) return rows;

    return rows.map((row) => {
        const draft = drafts[row.code];
        if (draft === undefined) return row;

        return { ...row, castName: draft, status: toMappingStatus(draft, row.inUse) };
    });
}

/**
 * 같은 CAST명이 두 시설에 물린 경우의 그 이름들.
 *
 * 시뮬레이션 시설과 여객시설은 1:1 이어야 한다. 둘이 같은 이름을 보면
 * 엔진이 어느 쪽 결과를 그 시설에 돌려줄지 알 수 없다.
 */
export function toDuplicateCastNames(rows: FcltMapRow[]): Set<string> {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const row of rows) {
        if (!row.castName) continue;
        if (seen.has(row.castName)) duplicates.add(row.castName);
        seen.add(row.castName);
    }

    return duplicates;
}

/** 시설그룹 필터 목록 — 표에 실제로 있는 그룹만, 등장 순서대로 */
function toFcltGroups(rows: FcltMapRow[]): FcltGroup[] {
    const groups = new Map<string, FcltGroup>();

    for (const row of rows) {
        const group = groups.get(row.groupCode);
        if (group) {
            group.count += 1;
            continue;
        }
        groups.set(row.groupCode, { code: row.groupCode, name: row.groupName, count: 1 });
    }

    return [...groups.values()];
}

/**
 * 도면 마커 — 서버 마커를 화면 좌표계로 옮긴다.
 * 시설 여러 건이 마커 하나에 걸리므로(N:1) 마커는 건수로만 말한다.
 */
function toFcltMarkers(markerList: MapMarkerDto[]): FcltMarker[] {
    return markerList.map((marker) => ({
        id: marker.markerId,
        label: marker.label,
        x: marker.cdntX,
        y: marker.cdntY,
        kind: marker.markerId.startsWith(DPTGT_GATE_PREFIX) ? 'depGate' : 'island',
        total: 0,
        unmapped: 0,
    }));
}

/**
 * 마커에 지금 목록 기준 건수를 다시 얹는다.
 * 편집으로 미매핑이 하나 줄면 도면의 빨간 뱃지도 같이 줄어야 한다.
 */
export function withMarkerCounts(markers: FcltMarker[], rows: FcltMapRow[]): FcltMarker[] {
    return markers.map((marker) => {
        const owned = rows.filter((row) => row.markerId === marker.id);

        return {
            ...marker,
            total: owned.length,
            unmapped: owned.filter((row) => row.status === 'unmapped').length,
        };
    });
}

/** 상단 요약 타일 — 전체 / 정상 / 미매핑 / 미사용 (클릭하면 그 상태로 거른다) */
export function toStatusTiles(rows: FcltMapRow[]): StatusTile[] {
    const countOf = (status: MappingStatus) => rows.filter((row) => row.status === status).length;

    return [
        { key: 'all', label: '전체', count: rows.length },
        { key: 'mapped', label: MAPPING_STATUS_LABEL.mapped, count: countOf('mapped') },
        { key: 'unmapped', label: MAPPING_STATUS_LABEL.unmapped, count: countOf('unmapped') },
        { key: 'unused', label: MAPPING_STATUS_LABEL.unused, count: countOf('unused') },
    ];
}

export function toFacilityMapData(dto: FcltMapListDto): FacilityMapData {
    const rows = dto.itemList.map(toFcltMapRow);

    return {
        stageAspect: STAGE_ASPECT,
        rows,
        groups: toFcltGroups(rows),
        markers: toFcltMarkers(dto.markerList),
        tiles: toStatusTiles(rows),
    };
}

/** 아직 못 받았거나 조회에 실패했을 때 — 화면 골격은 그대로 남는다 */
export const EMPTY_FACILITY_MAP: FacilityMapData = {
    stageAspect: STAGE_ASPECT,
    rows: [],
    groups: [],
    markers: [],
    tiles: toStatusTiles([]),
};
